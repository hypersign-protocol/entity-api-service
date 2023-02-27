import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCredentialDto } from '../dto/create-credential.dto';
import { UpdateCredentialDto } from '../dto/update-credential.dto';
import { ConfigService } from '@nestjs/config';
import { CredentialSSIService } from './credential.ssi.service';
import { HidWalletService } from 'src/hid-wallet/services/hid-wallet.service';
import { CredentialRepository } from '../repository/credential.repository';
import { EdvService } from 'src/edv/services/edv.service';
import { DidRepository } from 'src/did/repository/did.repository';
import { HypersignDID, HypersignVerifiableCredential } from 'hs-ssi-sdk';
import { VerifyCredentialDto } from '../dto/verify-credential.dto';
@Injectable()
export class CredentialService {
  constructor(
    private readonly config: ConfigService,
    private readonly credentialSSIService: CredentialSSIService,
    private readonly edvService: EdvService,
    private readonly hidWallet: HidWalletService,
    private credentialRepository: CredentialRepository,
    private readonly didRepositiory: DidRepository,
  ) {}
  async create(createCredentialDto: CreateCredentialDto, appDetail) {
    const {
      schemaId,
      subjectDid,
      schemaContext,
      type,
      issuerDid,
      expirationDate,
      fields,
      verificationMethodId,
      persist,
    } = createCredentialDto;
    const nameSpace = createCredentialDto.namespace;
    const didOfvmId = verificationMethodId.split('#')[0];

    const { edvId, edvDocId } = appDetail;
    await this.edvService.init(edvId);
    const didInfo = await this.didRepositiory.findOne({
      appId: appDetail.appId,
      did: didOfvmId,
    });
    if (!didInfo || didInfo == null) {
      throw new NotFoundException([
        `${verificationMethodId} not found`,
        `${verificationMethodId} is not owned by the appId ${appDetail.appId}`,
        `Resource not found`,
      ]);
    }
    const docs = await this.edvService.getDecryptedDocument(edvDocId);
    const mnemonic: string = docs.mnemonic;
    await this.hidWallet.generateWallet(mnemonic);
    try {
      const slipPathKeys = this.hidWallet.makeSSIWalletPath(
        didInfo.hdPathIndex,
      );

      const seed = await this.hidWallet.generateMemonicToSeedFromSlip10RawIndex(
        slipPathKeys,
      );

      const hypersignDid = new HypersignDID();

      const { privateKeyMultibase } = await hypersignDid.generateKeys({ seed });

      const hypersignVC = await this.credentialSSIService.initateHypersignVC(
        mnemonic,
        nameSpace,
      );
      let credential;

      if (schemaId) {
        credential = await hypersignVC.generate({
          schemaId,
          subjectDid,
          issuerDid,
          fields,
          expirationDate,
        });
      } else {
        if (!schemaContext || !type) {
          throw new BadRequestException([
            'schemaContext and type is required to create a schema',
          ]);
        }
        credential = await hypersignVC.generate({
          schemaContext,
          type,
          subjectDid,
          issuerDid,
          fields,
          expirationDate,
        });
      }
      const {
        signedCredential,
        credentialStatus,
        credentialStatusRegistrationResult,
      } = await hypersignVC.issue({
        credential,
        issuerDid,
        verificationMethodId,
        privateKeyMultibase,
      });
      let edvData = undefined;
      if (persist) {
        edvData = await this.edvService.createDocument({ signedCredential });
      }
      await this.credentialRepository.create({
        appId: appDetail.appId,
        credentialId: signedCredential.id,
        issuerDid,
        persist: persist,
        edvDocId: edvData && edvData.id ? edvData.id : '',
        transactionHash: credentialStatusRegistrationResult.transactionHash,
        type: signedCredential.type[1], // TODO : MAYBE REMOVE HARDCODING MAYBE NOT
      });
      return {
        credentialDocument: signedCredential,
        credentialStatus,
        persist,
      };
    } catch (e) {
      throw new BadRequestException([e.message]);
    }
  }

  async findAll(appDetail, paginationOption) {
    const skip = (paginationOption.page - 1) * paginationOption.limit;
    paginationOption['skip'] = skip;
    return await this.credentialRepository.find({
      appId: appDetail.appId,
      paginationOption,
    });
  }

  async resolveCredential(
    credentialId: string,
    appDetail,
    retrieveCredential: boolean,
  ) {
    const credentialDetail = await this.credentialRepository.findOne({
      appId: appDetail.appId,
      credentialId,
    });
    if (!credentialDetail || credentialDetail == null) {
      throw new NotFoundException([
        `${credentialId} is not found`,
        `${credentialId} does not belongs to the App id: ${appDetail.appId}`,
      ]);
    }
    let credential;
    if (credentialDetail.persist === true && retrieveCredential === true) {
      const { edvId } = appDetail;
      await this.edvService.init(edvId);
      const { signedCredential } = await this.edvService.getDecryptedDocument(
        credentialDetail.edvDocId,
      );
      credential = signedCredential;
    }

    const hypersignCredential = new HypersignVerifiableCredential();
    let credentialStatus;
    try {
      credentialStatus = await hypersignCredential.resolveCredentialStatus({
        credentialId,
      });
    } catch (e) {
      throw new BadRequestException([e.message]);
    }
    return {
      credentialDocument: credential ? credential : undefined,
      credentialStatus,
      persist: credentialDetail.persist,
      retrieveCredential,
    };
  }

  async update(
    id: string,
    updateCredentialDto: UpdateCredentialDto,
    appDetail,
  ) {
    const { status, statusReason, issuerDid, namespace, verificationMethodId } =
      updateCredentialDto;
    const statusChange =
      status === 'SUSPEND'
        ? 'SUSPENDED'
        : status === 'REVOKE'
        ? 'REVOKED'
        : 'LIVE';
    const didOfvmId = verificationMethodId.split('#')[0];

    const { edvId, edvDocId } = appDetail;
    await this.edvService.init(edvId);
    const didInfo = await this.didRepositiory.findOne({
      appId: appDetail.appId,
      did: didOfvmId,
    });
    if (!didInfo || didInfo == null) {
      throw new NotFoundException([
        `${verificationMethodId} not found`,
        `${verificationMethodId} is not owned by the appId ${appDetail.appId}`,
        `Resource not found`,
      ]);
    }

    const docs = await this.edvService.getDecryptedDocument(edvDocId);
    const mnemonic: string = docs.mnemonic;
    await this.hidWallet.generateWallet(mnemonic);

    try {
      const slipPathKeys = this.hidWallet.makeSSIWalletPath(
        didInfo.hdPathIndex,
      );
      const seed = await this.hidWallet.generateMemonicToSeedFromSlip10RawIndex(
        slipPathKeys,
      );

      const hypersignDid = new HypersignDID();
      const { privateKeyMultibase } = await hypersignDid.generateKeys({ seed });
      const hypersignVC = await this.credentialSSIService.initateHypersignVC(
        mnemonic,
        namespace,
      );
      const credentialStatus = await hypersignVC.resolveCredentialStatus({
        credentialId: id,
      });
      const updatedCredResult = await hypersignVC.updateCredentialStatus({
        credentialStatus,
        issuerDid,
        verificationMethodId,
        privateKeyMultibase,
        status: statusChange,
        statusReason,
      });
      await this.credentialRepository.findOneAndUpdate(
        { appId: appDetail.appId, credentialId: id },
        { transactionHash: updatedCredResult.transactionHash },
      );

      return await hypersignVC.resolveCredentialStatus({
        credentialId: id,
      });
    } catch (e) {
      throw new BadRequestException([e.message]);
    }
  }

  async verfiyCredential(verifyCredentialDto: VerifyCredentialDto, appDetail) {
    const { id, issuer } = verifyCredentialDto.credentialDocument;
    const credentialDetail = await this.credentialRepository.findOne({
      appId: appDetail.appId,
      credentialId: id,
    });
    if (!credentialDetail || credentialDetail == null) {
      throw new NotFoundException([
        `${id} is not found`,
        `${id} does not belongs to the App id: ${appDetail.appId}`,
      ]);
    }
    const issuerDetail = await this.didRepositiory.findOne({
      appId: appDetail.appId,
      did: issuer,
    });
    if (!issuerDetail || issuerDetail == null) {
      throw new NotFoundException([
        `${issuerDetail.did} is not found`,
        `${issuerDetail.did} does not belongs to the App id: ${appDetail.appId}`,
      ]);
    }
    const hypersignCredential = new HypersignVerifiableCredential();
    let verificationResult;
    try {
      verificationResult = await hypersignCredential.verify({
        credential: verifyCredentialDto.credentialDocument,
        issuerDid: issuer,
        verificationMethodId:
          verifyCredentialDto.credentialDocument.proof.verificationMethod,
      });
    } catch (e) {
      throw new BadRequestException([e.message]);
    }
    return verificationResult;
  }
}
