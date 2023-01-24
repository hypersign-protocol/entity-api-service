import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { CreateDidDto } from '../dto/create-did.dto';
import { UpdateDidDto } from '../dto/update-did.dto';
import { HypersignDID } from 'hs-ssi-sdk';
import { DidRepository, DidMetaDataRepo } from '../repository/did.repository';
import { EdvService } from 'src/edv/services/edv.service';
import { Slip10RawIndex } from '@cosmjs/crypto';
import { ConfigService } from '@nestjs/config';
import { HidWalletService } from '../../hid-wallet/services/hid-wallet.service';
import { DidSSIService } from './did.ssi.service';

@Injectable({ scope: Scope.REQUEST })
export class DidService {
  constructor(
    private readonly didRepositiory: DidRepository,
    private readonly didMetadataRepository: DidMetaDataRepo,
    private readonly edvService: EdvService,
    private readonly hidWallet: HidWalletService,
    private readonly didSSIService: DidSSIService,
  ) {}

  async create(createDidDto: CreateDidDto, appDetail): Promise<Object> {
    try {
      const nameSpace = createDidDto.method;
      const { edvId, edvDocId } = appDetail;
      await this.edvService.init(edvId);
      const docs = await this.edvService.getDecryptedDocument(edvDocId);
      const mnemonic: string = docs.mnemonic;
      const hypersignDid = await this.didSSIService.initiateHypersignDid(
        mnemonic,
        createDidDto.method,
      );

      const didData = await this.didMetadataRepository.findOne({
        appId: appDetail.appId,
      });

      let hdPathIndex;
      if (didData === null) {
        hdPathIndex = 0;
      } else {
        hdPathIndex = didData.hdPathIndex + 1;
      }

      const slipPathKeys: Array<Slip10RawIndex> =
        this.hidWallet.makeSSIWalletPath(hdPathIndex);
      const seed = await this.hidWallet.generateMemonicToSeedFromSlip10RawIndex(
        slipPathKeys,
      );
      const { publicKeyMultibase, privateKeyMultibase } =
        await hypersignDid.generateKeys({ seed });

      const didDoc = await hypersignDid.generate({ publicKeyMultibase });

      const params = {
        didDocument: didDoc,
        privateKeyMultibase,
        verificationMethodId: didDoc.verificationMethod[0].id,
      };
      const registerDidDoc = await hypersignDid.register(params);
      this.didMetadataRepository.findAndReplace(
        { appId: appDetail.appId },
        {
          did: didDoc.id,
          slipPathKeys,
          hdPathIndex,
          appId: appDetail.appId,
        },
      );

      this.didRepositiory.create({
        did: didDoc.id,
        appId: appDetail.appId,
        slipPathKeys,
        hdPathIndex,
      });
      return didDoc;
    } catch (e) {
      throw new BadRequestException([e.message]);
    }
  }

  async getDidList(appDetail) {
    const didList = await this.didRepositiory.find({ appId: appDetail.appId });
    if (didList.length <= 0) {
      throw new NotFoundException([
        `No did has created for appId ${appDetail.appId}`,
      ]);
    }

    return didList;
  }

  async resolveDid(appDetail, did: string) {
    const didInfo = await this.didRepositiory.findOne({
      appId: appDetail.appId,
      did,
    });
    if (!didInfo || didInfo == null) {
      throw new NotFoundException([
        `${did} is not found`,
        `${did} does not belongs to the App id: ${appDetail.appId}`,
      ]);
    }
    const hypersignDid = new HypersignDID();
    const resolvedDid = await hypersignDid.resolve({ did });
    if (resolvedDid.didDocumentMetadata === null) {
      throw new NotFoundException([`${did} does not exists on chain`]);
    }
    return resolvedDid;
  }

  async updateDid(updateDidDto: UpdateDidDto, appDetail) {
    // To Do :- how to validate didDoc is valid didDoc
    // To Do :- should be only update those did that are generated on studio?

    const { verificationMethodId } = updateDidDto;

    const didOfVmId = verificationMethodId.split('#')[0];

    if (
      updateDidDto.didDoc['id'] == undefined ||
      updateDidDto.didDoc['id'] == ''
    ) {
      throw new BadRequestException('Invalid didDoc');
    }

    const did = updateDidDto.didDoc['id'];
    const { edvId, edvDocId } = appDetail;
    await this.edvService.init(edvId);
    const docs = await this.edvService.getDecryptedDocument(edvDocId);
    const mnemonic: string = docs.mnemonic;

    const hypersignDid = await this.didSSIService.initiateHypersignDid(
      mnemonic,
      'testnet',
    );

    const didInfo = await this.didRepositiory.findOne({
      appId: appDetail.appId,
      did: didOfVmId,
    });
    if (!didInfo || didInfo == null) {
      throw new NotFoundException([`Resource not found`]);
    }

    const { didDocument: resolvedDid, didDocumentMetadata } =
      await hypersignDid.resolve({ did: didOfVmId });

    if (didDocumentMetadata === null) {
      throw new NotFoundException([
        `${didOfVmId} is not registered on the chain`,
      ]);
    }

    const { didDocumentMetadata: updatedDidDocMetaData } =
      await hypersignDid.resolve({ did });
    if (updatedDidDocMetaData === null) {
      throw new NotFoundException([`${did} is not registered on the chain`]);
    }

    const slipPathKeys = this.hidWallet.makeSSIWalletPath(didInfo.hdPathIndex);

    const seed = await this.hidWallet.generateMemonicToSeedFromSlip10RawIndex(
      slipPathKeys,
    );

    const { privateKeyMultibase } = await hypersignDid.generateKeys({ seed });
    let updatedDid;
    try {
      if (!updateDidDto.isToDeactivateDid) {
        updatedDid = await hypersignDid.update({
          didDocument: updateDidDto.didDoc,
          privateKeyMultibase,
          verificationMethodId: resolvedDid['verificationMethod'][0].id,
          versionId: updatedDidDocMetaData.versionId,
        });
      } else {
        updatedDid = await hypersignDid.deactivate({
          didDocument: updateDidDto.didDoc,
          privateKeyMultibase,
          verificationMethodId: resolvedDid['verificationMethod'][0].id,
          versionId: updatedDidDocMetaData.versionId,
        });
      }
    } catch (error) {
      throw new BadRequestException([error.message]);
    }

    return updatedDid;
  }
}
