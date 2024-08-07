import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateCredentialDto } from '../dto/create-credential.dto';
import { UpdateCredentialDto } from '../dto/update-credential.dto';
import { ConfigService } from '@nestjs/config';
import { CredentialSSIService } from './credential.ssi.service';
import { HidWalletService } from 'src/hid-wallet/services/hid-wallet.service';
import { CredentialRepository } from '../repository/credential.repository';
import { DidRepository } from 'src/did/repository/did.repository';
import { HypersignDID, HypersignVerifiableCredential } from 'hs-ssi-sdk';
import { VerifyCredentialDto } from '../dto/verify-credential.dto';
import { RegisterCredentialStatusDto } from '../dto/register-credential.dto';
import { getAppVault, getAppMenemonic } from '../../utils/app-vault-service';
import { TxSendModuleService } from 'src/tx-send-module/tx-send-module.service';

@Injectable()
export class CredentialService {
  constructor(
    private readonly config: ConfigService,
    private readonly credentialSSIService: CredentialSSIService,
    private readonly hidWallet: HidWalletService,
    private credentialRepository: CredentialRepository,
    private readonly didRepositiory: DidRepository,
    private readonly txnService: TxSendModuleService,
  ) {}

  async create(createCredentialDto: CreateCredentialDto, appDetail) {
    Logger.log('create() method: starts....', 'CredentialService');
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
    let { registerCredentialStatus } = createCredentialDto;
    const nameSpace = createCredentialDto.namespace;
    const didOfvmId = verificationMethodId.split('#')[0]; // issuer's did

    const { edvId, kmsId } = appDetail;
    Logger.log(
      'create() method: before initialising edv service',
      'CredentialService',
    );

    // await this.edvService.init(edvId);
    // Step 1: Fist find the issuer exists or not
    Logger.log({
      appId: appDetail.appId,
      didOfvmId,
    });
    const didInfo = await this.didRepositiory.findOne({
      appId: appDetail.appId,
      did: didOfvmId,
    });
    if (!didInfo || didInfo == null) {
      Logger.error(
        'create() method: Error: No issuer did found',
        'CredentialService',
      );
      throw new NotFoundException([
        `${verificationMethodId} not found`,
        `${verificationMethodId} is not owned by the appId ${appDetail.appId}`,
        `Resource not found`,
      ]);
    }

    Logger.log(
      'create() method: before generating Hid wallet',
      'CredentialService',
    );

    try {
      // Issuer Identity: - used for authenticating credenital
      const appVault = await getAppVault(kmsId, edvId);
      const { mnemonic: issuerMnemonic } = await appVault.getDecryptedDocument(
        didInfo.kmsId,
      );
      const seed = await this.hidWallet.getSeedFromMnemonic(issuerMnemonic);
      const hypersignDid = new HypersignDID();
      const { privateKeyMultibase } = await hypersignDid.generateKeys({ seed });

      // Apps Identity: - used for gas fee
      const appMenemonic = await getAppMenemonic(kmsId);
      const hypersignVC = await this.credentialSSIService.initateHypersignVC(
        appMenemonic,
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
        Logger.log(
          'create() method: generating hypersignVC',
          'CredentialService',
        );
        credential = await hypersignVC.generate({
          schemaContext,
          type,
          subjectDid,
          issuerDid,
          fields,
          expirationDate,
        });
      }
      Logger.log(
        'create() method: before calling hypersignVC.issue',
        'CredentialService',
      );
      if (registerCredentialStatus == undefined) {
        registerCredentialStatus = true;
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
        registerCredential: false,
      });

      const credStatusTemp = {};
      Object.assign(credStatusTemp, credentialStatus);

      const credStatus = {
        credentialStatus,
        namespace: 'testnet',
      } as RegisterCredentialStatusDto;

      await this.registerCredentialStatus(credStatus, appDetail);

      let edvData = undefined;
      if (persist) {
        const creedential = {
          ...signedCredential,
        };
        const creedentialEdvDoc = appVault.prepareEdvDocument(creedential, [
          {
            index: 'content.id',
            unique: true,
          },
          {
            index: 'content.issuer',
            unique: false,
          },
          {
            index: 'content.credentialSubject.id',
            unique: false,
          },
          ,
        ]);
        edvData = await appVault.insertDocument(creedentialEdvDoc);
      }
      Logger.log(
        'create() method: before creating credential doc in db',
        'CredentialService',
      );
      await this.credentialRepository.create({
        appId: appDetail.appId,
        credentialId: signedCredential.id,
        issuerDid,
        persist: persist,
        edvDocId: edvData && edvData.id ? edvData.id : '',
        transactionHash: credentialStatusRegistrationResult
          ? credentialStatusRegistrationResult.transactionHash
          : '',
        type: signedCredential.type[1], // TODO : MAYBE REMOVE HARDCODING MAYBE NOT
      });
      Logger.log('create() method: ends....', 'CredentialService');

      return {
        credentialDocument: signedCredential,
        credentialStatus: credStatusTemp,
        persist,
      };
    } catch (e) {
      throw new BadRequestException([e.message]);
    }
  }

  async findAll(appDetail, paginationOption) {
    Logger.log('findAll() method: starts....', 'CredentialService');
    const skip = (paginationOption.page - 1) * paginationOption.limit;
    paginationOption['skip'] = skip;
    Logger.log('findAll() method: fetching data from db', 'CredentialService');
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
    Logger.log('resolveCredential() method: starts....', 'CredentialService');

    const credentialDetail = await this.credentialRepository.findOne({
      appId: appDetail.appId,
      credentialId,
    });
    if (!credentialDetail || credentialDetail == null) {
      Logger.error(
        'resolveCredential() method: Error: Credential not found',
        'CredentialService',
      );
      throw new NotFoundException([
        `${credentialId} is not found`,
        `${credentialId} does not belongs to the App id: ${appDetail.appId}`,
      ]);
    }
    let credential;
    if (credentialDetail.persist === true && retrieveCredential === true) {
      const { edvId, kmsId } = appDetail;
      Logger.log(
        'resolveCredential() method: before initialising edv service',
        'CredentialService',
      );
      const appVault = await getAppVault(kmsId, edvId);
      const signedCredential = await appVault.getDecryptedDocument(
        credentialDetail.edvDocId,
      );
      credential = signedCredential;
    }
    Logger.log(
      'resolveCredential() method: before initialising HypersignVerifiableCredential',
      'CredentialService',
    );
    const hypersignCredential = new HypersignVerifiableCredential();
    let credentialStatus;
    try {
      credentialStatus = await hypersignCredential.resolveCredentialStatus({
        credentialId,
      });
    } catch (e) {
      credentialStatus = undefined;
    }
    Logger.log('resolveCredential() method: ends....', 'CredentialService');

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
    Logger.log('update() method: starts....', 'CredentialService');

    const { status, statusReason, issuerDid, namespace, verificationMethodId } =
      updateCredentialDto;
    const statusChange =
      status === 'SUSPEND'
        ? 'SUSPENDED'
        : status === 'REVOKE'
        ? 'REVOKED'
        : 'LIVE';
    const didOfvmId = verificationMethodId.split('#')[0];

    const { edvId, kmsId } = appDetail;
    Logger.log(
      'update() method: before initialising edv service',
      'CredentialService',
    );
    const didInfo = await this.didRepositiory.findOne({
      appId: appDetail.appId,
      did: didOfvmId,
    });
    if (!didInfo || didInfo == null) {
      Logger.error(
        'update() method: Error: didInfo not found',
        'CredentialService',
      );

      throw new NotFoundException([
        `${verificationMethodId} not found`,
        `${verificationMethodId} is not owned by the appId ${appDetail.appId}`,
        `Resource not found`,
      ]);
    }

    try {
      // Issuer Identity: - used for authenticating credenital
      const appVault = await getAppVault(kmsId, edvId);
      const { mnemonic: issuerMnemonic } = await appVault.getDecryptedDocument(
        didInfo.kmsId,
      );
      const seed = await this.hidWallet.getSeedFromMnemonic(issuerMnemonic);
      const hypersignDid = new HypersignDID();
      const { privateKeyMultibase } = await hypersignDid.generateKeys({ seed });

      // Apps Identity: - used for gas fee
      const appMenemonic = await getAppMenemonic(kmsId);
      const nameSpace = namespace
        ? namespace
        : this.config.get('NETWORK')
        ? this.config.get('NETWORK')
        : 'testnet';
      const hypersignVC = await this.credentialSSIService.initateHypersignVC(
        appMenemonic,
        nameSpace,
      );
      Logger.log(
        'update() method: before calling hypersignVC.resolveCredentialStatus to resolve cred status',
        'CredentialService',
      );
      const credentialStatus = await hypersignVC.resolveCredentialStatus({
        credentialId: id,
      });
      Logger.log(
        'update() method: before calling hypersignVC.updateCredentialStatus to update cred status on chain',
        'CredentialService',
      );
      const updateCredenital: any = await hypersignVC.updateCredentialStatus({
        credentialStatus,
        issuerDid,
        verificationMethodId,
        privateKeyMultibase,
        status: statusChange,
        statusReason,
        readonly: true,
      });

      console.log(
        updateCredenital?.credentialStatus,
        updateCredenital?.proofValue,
      );

      await this.txnService.sendUpdateVC(
        updateCredenital?.credentialStatus,
        updateCredenital?.proofValue,
        appMenemonic,
      );

      // await this.credentialRepository.findOneAndUpdate(
      //   { appId: appDetail.appId, credentialId: id },
      //   { transactionHash: updatedCredResult.transactionHash },
      // );
      Logger.log('update() method: ends....', 'CredentialService');

      return await hypersignVC.resolveCredentialStatus({
        credentialId: id,
      });
    } catch (e) {
      Logger.error(`update() method: Error ${e.message}`, 'CredentialService');
      throw new BadRequestException([e.message]);
    }
  }

  async verfiyCredential(verifyCredentialDto: VerifyCredentialDto, appDetail) {
    Logger.log('verfiyCredential() method: starts....', 'CredentialService');
    const { id, issuer } = verifyCredentialDto.credentialDocument;
    const credentialDetail = await this.credentialRepository.findOne({
      appId: appDetail.appId,
      credentialId: id,
    });
    if (!credentialDetail || credentialDetail == null) {
      Logger.error(
        'verfiyCredential() method: Error: Credential not found',
        'CredentialService',
      );

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
      Logger.error(
        'verfiyCredential() method: Error: did not found',
        'CredentialService',
      );

      throw new NotFoundException([
        `${issuerDetail.did} is not found`,
        `${issuerDetail.did} does not belongs to the App id: ${appDetail.appId}`,
      ]);
    }
    const hypersignCredential = new HypersignVerifiableCredential();
    let verificationResult;
    try {
      Logger.log(
        'verfiyCredential() method: before calling hypersignVC.verify to verify credential',
        'CredentialService',
      );
      verificationResult = await hypersignCredential.verify({
        credential: verifyCredentialDto.credentialDocument as any, // will fix it latter
        issuerDid: issuer,
        verificationMethodId:
          verifyCredentialDto.credentialDocument.proof.verificationMethod,
      });
    } catch (e) {
      Logger.error(
        `verfiyCredential() method: Error:${e.message}`,
        'CredentialService',
      );
      throw new BadRequestException([e.message]);
    }
    Logger.log('verfiyCredential() method: ends....', 'CredentialService');

    return verificationResult;
  }

  // TODO: need to tested
  async registerCredentialStatus(
    registerCredentialDto: RegisterCredentialStatusDto,
    appDetail,
  ) {
    Logger.log(
      'registerCredentialStatus() method: starts....',
      'CredentialService',
    );

    const { credentialStatus, namespace } = registerCredentialDto;
    const { kmsId } = appDetail;
    Logger.log(
      'registerCredentialStatus() method: initialising edv service',
      'CredentialService',
    );
    let registeredVC: { transactionHash: string };
    try {
      const appMenemonic = await getAppMenemonic(kmsId);
      Logger.log(
        'registerCredentialStatus() method: before calling hypersignVC.registerCredentialStatus to register credential status on chain',
        'CredentialService',
      );
      const { proof } = credentialStatus;
      delete credentialStatus['proof'];
      // registeredVC = await hypersignVC.registerCredentialStatus({
      //   credentialStatus,
      //   credentialStatusProof: proof,
      // });

      await this.txnService.sendVCTxn(credentialStatus, proof, appMenemonic);
    } catch (e) {
      Logger.error(
        `registerCredentialStatus() method: Error ${e.message}`,
        'CredentialService',
      );
      throw new BadRequestException([e.message]);
    }
    Logger.log(
      'registerCredentialStatus() method: ends....',
      'CredentialService',
    );
    return { transactionHash: registeredVC?.transactionHash };
  }
}
