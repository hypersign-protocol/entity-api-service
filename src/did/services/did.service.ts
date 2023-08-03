import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import {
  CreateDidDto,
  RegisterDidResponse,
  TxnHash,
  CreateDidResponse,
} from '../dto/create-did.dto';
import { UpdateDidDto } from '../dto/update-did.dto';
import {
  HypersignDID,
  IVerificationRelationships,
  IKeyType,
  IClientSpec,
  Did,
} from 'hs-ssi-sdk';
import { DidRepository, DidMetaDataRepo } from '../repository/did.repository';
import { EdvService } from 'src/edv/services/edv.service';
import { Slip10RawIndex } from '@cosmjs/crypto';
import { HidWalletService } from '../../hid-wallet/services/hid-wallet.service';
import { DidSSIService } from './did.ssi.service';
import { RegistrationStatus } from '../schemas/did.schema';
import { RegisterDidDto } from '../dto/register-did.dto';
import { Did as IDidDto } from '../schemas/did.schema';

@Injectable({ scope: Scope.REQUEST })
export class DidService {
  constructor(
    private readonly didRepositiory: DidRepository,
    private readonly didMetadataRepository: DidMetaDataRepo,
    private readonly edvService: EdvService,
    private readonly hidWallet: HidWalletService,
    private readonly didSSIService: DidSSIService,
  ) {}

  async createByClientSpec(createDidDto: CreateDidDto, appDetail) {
    let methodSpecificId = createDidDto.methodSpecificId;
    const publicKey = createDidDto.options?.publicKey;
    const chainId = createDidDto.options.chainId;
    const keyType: IKeyType = createDidDto.options.keyType;
    const address = createDidDto.options.walletAddress;
    const register = createDidDto.options?.register;
    let verificationRelationships: IVerificationRelationships[];
    if (
      createDidDto.options?.verificationRelationships &&
      createDidDto.options?.verificationRelationships.length > 0
    ) {
      verificationRelationships =
        createDidDto.options.verificationRelationships;
      if (
        verificationRelationships.includes(
          IVerificationRelationships.keyAgreement,
        )
      ) {
        throw new BadRequestException([
          'verificationRelationships.keyAgreement is not allowed at the time of creating a did',
        ]);
      }
    }
    if (!methodSpecificId) {
      methodSpecificId = address;
    }
    if (!address) {
      throw new BadRequestException([
        'options.walletAddress is not passed , required for keyType ' +
          IKeyType.EcdsaSecp256k1RecoveryMethod2020,
      ]);
    }
    if (!chainId) {
      throw new BadRequestException([
        'options.chainId is not passed , required for keyType ' +
          IKeyType.EcdsaSecp256k1RecoveryMethod2020,
      ]);
    }

    if (register === true) {
      throw new BadRequestException([
        'options.register is true for keyType ' +
          IKeyType.EcdsaSecp256k1RecoveryMethod2020,
        IKeyType.EcdsaSecp256k1RecoveryMethod2020 +
          ' doesnot support register without signature being passed',
        'options.register:false is strongly recomended',
      ]);
    }

    const { edvId, edvDocId } = appDetail;
    await this.edvService.init(edvId);
    const docs = await this.edvService.getDecryptedDocument(edvDocId);
    const mnemonic: string = docs.mnemonic;
    const hypersignDid = await this.didSSIService.initiateHypersignDid(
      mnemonic,
      createDidDto.namespace,
    );
    let clientSpec: IClientSpec;
    if (keyType) {
      if (keyType === IKeyType.EcdsaSecp256k1RecoveryMethod2020) {
        clientSpec = IClientSpec['eth-personalSign'];
      } else if (keyType === IKeyType.EcdsaSecp256k1VerificationKey2019) {
        clientSpec = IClientSpec['cosmos-ADR036'];
      } else {
        throw new BadRequestException([`Invalid KeyType ${keyType}`]);
      }
    }
    const didDoc = await hypersignDid.createByClientSpec({
      methodSpecificId,
      publicKey,
      chainId,
      clientSpec,
      address,
      verificationRelationships,
    });

    return {
      did: didDoc.id,
      registrationStatus: RegistrationStatus.UNREGISTRED,
      transactionHash: '',
      metaData: {
        didDocument: didDoc,
      },
    };
  }

  async create(
    createDidDto: CreateDidDto,
    appDetail,
  ): Promise<CreateDidResponse> {
    try {
      const methodSpecificId = createDidDto.methodSpecificId;
      let verificationRelationships: IVerificationRelationships[];
      if (
        createDidDto.options?.verificationRelationships &&
        createDidDto.options?.verificationRelationships.length > 0
      ) {
        verificationRelationships =
          createDidDto.options.verificationRelationships;
        if (
          verificationRelationships.includes(
            IVerificationRelationships.keyAgreement,
          )
        ) {
          throw new BadRequestException([
            'verificationRelationships.keyAgreement is not allowed at the time of creating a did',
          ]);
        }
      }
      const { edvId, edvDocId } = appDetail;
      await this.edvService.init(edvId);
      const docs = await this.edvService.getDecryptedDocument(edvDocId);
      const mnemonic: string = docs.mnemonic;
      const hypersignDid = await this.didSSIService.initiateHypersignDid(
        mnemonic,
        createDidDto.namespace,
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
      const didDoc = await hypersignDid.generate({
        methodSpecificId,
        publicKeyMultibase,
        verificationRelationships,
      });

      const params = {
        didDocument: didDoc,
        privateKeyMultibase,
        verificationMethodId: didDoc['verificationMethod'][0].id,
      };
      let registerDidDoc;
      //we aree not registering did at the time of creating it
      // Will remove this code later
      if (createDidDto.options?.register === true) {
        registerDidDoc = await hypersignDid.register(params);
      }
      this.didMetadataRepository.findAndReplace(
        { appId: appDetail.appId },
        {
          did: didDoc.id,
          slipPathKeys,
          hdPathIndex,
          appId: appDetail.appId,
        },
      );

      await this.didRepositiory.create({
        did: didDoc.id,
        appId: appDetail.appId,
        slipPathKeys,
        hdPathIndex,
        transactionHash:
          registerDidDoc && registerDidDoc?.transactionHash
            ? registerDidDoc.transactionHash
            : '',
        registrationStatus:
          registerDidDoc && registerDidDoc?.transactionHash
            ? RegistrationStatus.COMPLETED
            : RegistrationStatus.UNREGISTRED,
      });
      return {
        did: didDoc.id,
        registrationStatus:
          registerDidDoc && registerDidDoc?.transactionHash
            ? RegistrationStatus.COMPLETED
            : RegistrationStatus.UNREGISTRED,
        transactionHash:
          registerDidDoc && registerDidDoc?.transactionHash
            ? registerDidDoc.transactionHash
            : '',
        metaData: {
          didDocument: didDoc,
        },
      };
    } catch (e) {
      if (e.code === 11000) {
        throw new ConflictException(['Duplicate key error']);
      }
      throw new BadRequestException([e.message]);
    }
  }

  async register(
    registerDidDto: RegisterDidDto,
    appDetail,
  ): Promise<RegisterDidResponse> {
    let registerDidDoc;
    const { edvId, edvDocId } = appDetail;
    await this.edvService.init(edvId);
    const docs = await this.edvService.getDecryptedDocument(edvDocId);

    const mnemonic: string = docs.mnemonic;

    const namespace = registerDidDto.didDocument['id'].split(':')[2]; // Todo Remove this worst way of doing it
    const DidInfo = await this.didRepositiory.findOne({
      appId: appDetail.appId,
      did: registerDidDto.didDocument['id'],
    });
    if (DidInfo !== null && DidInfo.registrationStatus === 'COMPLETED') {
      throw new BadRequestException([
        `${registerDidDto.didDocument['id']} already registered`,
      ]);
    }
    const hypersignDid = await this.didSSIService.initiateHypersignDid(
      mnemonic,
      namespace,
    );
    let data;
    const { didDocument, signInfos, verificationMethodId } = registerDidDto;
    if (!verificationMethodId && signInfos) {
      registerDidDoc = await hypersignDid.registerByClientSpec({
        didDocument,
        signInfos,
      });
      data = await this.didRepositiory.create({
        did: didDocument['id'],
        appId: appDetail.appId,
        slipPathKeys: null,
        hdPathIndex: null,
        transactionHash:
          registerDidDoc && registerDidDoc?.transactionHash
            ? registerDidDoc.transactionHash
            : '',
        registrationStatus:
          registerDidDoc && registerDidDoc?.transactionHash
            ? RegistrationStatus.COMPLETED
            : RegistrationStatus.UNREGISTRED,
      });
    } else {
      const didData = await this.didRepositiory.findOne({
        did: didDocument['id'],
      });

      if (!didData) {
        throw new NotFoundException([didDocument['id'] + ' not found']);
      }

      const hdPathIndex = didData.hdPathIndex;

      const slipPathKeys: Array<Slip10RawIndex> =
        this.hidWallet.makeSSIWalletPath(hdPathIndex);

      const seed = await this.hidWallet.generateMemonicToSeedFromSlip10RawIndex(
        slipPathKeys,
      );
      const { privateKeyMultibase } = await hypersignDid.generateKeys({
        seed: seed,
      });
      const regDidDocument = registerDidDto.didDocument as Did;
      const params = {
        didDocument: regDidDocument,
        privateKeyMultibase,
        verificationMethodId: verificationMethodId,
      };

      registerDidDoc = await hypersignDid.register(params);
      data = await this.didRepositiory.findOneAndUpdate(
        { did: didDocument['id'] },
        {
          did: didDocument['id'],
          appId: appDetail.appId,
          slipPathKeys,
          hdPathIndex,
          transactionHash:
            registerDidDoc && registerDidDoc?.transactionHash
              ? registerDidDoc.transactionHash
              : '',
          registrationStatus:
            registerDidDoc && registerDidDoc?.transactionHash
              ? RegistrationStatus.COMPLETED
              : RegistrationStatus.UNREGISTRED,
        },
      );
    }
    return {
      did: data.did,
      registrationStatus: data.registrationStatus,
      transactionHash: data.transactionHash,
      metaData: {
        didDocument: registerDidDto.didDocument,
      },
    };
  }

  async getDidList(appDetail, option): Promise<IDidDto[]> {
    const skip = (option.page - 1) * option.limit;
    option['skip'] = skip;
    const didList = await this.didRepositiory.find({
      appId: appDetail.appId,
      option,
    });
    // if (didList.length <= 0) {
    //   throw new NotFoundException([
    //     `No did has created for appId ${appDetail.appId}`,
    //   ]);
    // }
    return didList;
  }

  async resolveDid(appDetail, did: string) {
    const didInfo = await this.didRepositiory.findOne({
      did,
    });
    let resolvedDid;
    if (didInfo !== null && didInfo.registrationStatus !== 'COMPLETED') {
      const { edvId, edvDocId } = appDetail;
      await this.edvService.init(edvId);
      const docs = await this.edvService.getDecryptedDocument(edvDocId);
      const mnemonic: string = docs.mnemonic;
      const didSplitedArray = did.split(':'); // Todo Remove this worst way of doing it
      const namespace = didSplitedArray[2];
      const methodSpecificId = didSplitedArray[3];
      const hypersignDid = await this.didSSIService.initiateHypersignDid(
        mnemonic,
        namespace,
      );
      const hdPathIndex = didInfo.hdPathIndex;
      const slipPathKeys: Array<Slip10RawIndex> =
        this.hidWallet.makeSSIWalletPath(hdPathIndex);
      const seed = await this.hidWallet.generateMemonicToSeedFromSlip10RawIndex(
        slipPathKeys,
      );
      const { publicKeyMultibase } = await hypersignDid.generateKeys({ seed });
      resolvedDid = await hypersignDid.generate({
        methodSpecificId,
        publicKeyMultibase,
      });
      const tempResolvedDid = {
        didDocument: resolvedDid,
        didDocumentMetadata: {},
      };
      resolvedDid = tempResolvedDid;
    } else {
      const hypersignDid = new HypersignDID();
      resolvedDid = await hypersignDid.resolve({ did });
    }
    return resolvedDid;
  }

  async updateDid(updateDidDto: UpdateDidDto, appDetail): Promise<TxnHash> {
    if (
      updateDidDto.didDocument['id'] == undefined ||
      updateDidDto.didDocument['id'] == ''
    ) {
      throw new BadRequestException('Invalid didDoc');
    }

    let updatedDid;
    if (!updateDidDto.verificationMethodId) {
      const did = updateDidDto.didDocument['id'];
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
        did,
      });
      const { signInfos } = updateDidDto;
      // If signature is passed then no need to check if it is present in db or not
      if (!signInfos && (!didInfo || didInfo == null)) {
        throw new NotFoundException([
          `${did} not found`,
          `${did} is not owned by the appId ${appDetail.appId}`,
          `Resource not found`,
        ]);
      }
      const { didDocumentMetadata: updatedDidDocMetaData } =
        await hypersignDid.resolve({ did });
      if (updatedDidDocMetaData === null) {
        throw new NotFoundException([`${did} is not registered on the chain`]);
      }
      try {
        if (!updateDidDto.deactivate) {
          updatedDid = await hypersignDid.updateByClientSpec({
            didDocument: updateDidDto.didDocument as Did,
            signInfos,
            versionId: updatedDidDocMetaData.versionId,
          });
        } else {
          updatedDid = await hypersignDid.deactivateByClientSpec({
            didDocument: updateDidDto.didDocument as Did,
            signInfos,
            versionId: updatedDidDocMetaData.versionId,
          });
        }
      } catch (error) {
        throw new BadRequestException([error.message]);
      }
    } else {
      const { verificationMethodId } = updateDidDto;
      const didOfVmId = verificationMethodId?.split('#')[0];
      if (
        updateDidDto.didDocument['id'] == undefined ||
        updateDidDto.didDocument['id'] == ''
      ) {
        throw new BadRequestException('Invalid didDoc');
      }

      const did = updateDidDto.didDocument['id'];
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
        throw new NotFoundException([
          `${verificationMethodId} not found`,
          `${verificationMethodId} is not owned by the appId ${appDetail.appId}`,
          `Resource not found`,
        ]);
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
      const slipPathKeys = this.hidWallet.makeSSIWalletPath(
        didInfo.hdPathIndex,
      );

      const seed = await this.hidWallet.generateMemonicToSeedFromSlip10RawIndex(
        slipPathKeys,
      );

      const { privateKeyMultibase } = await hypersignDid.generateKeys({
        seed,
      });
      try {
        if (!updateDidDto.deactivate) {
          updatedDid = await hypersignDid.update({
            didDocument: updateDidDto.didDocument as Did,
            privateKeyMultibase,
            verificationMethodId: resolvedDid['verificationMethod'][0].id,
            versionId: updatedDidDocMetaData.versionId,
          });
        } else {
          updatedDid = await hypersignDid.deactivate({
            didDocument: updateDidDto.didDocument as Did,
            privateKeyMultibase,
            verificationMethodId: resolvedDid['verificationMethod'][0].id,
            versionId: updatedDidDocMetaData.versionId,
          });
        }
      } catch (error) {
        throw new BadRequestException([error.message]);
      }
    }

    return { transactionHash: updatedDid.transactionHash };
  }
}
