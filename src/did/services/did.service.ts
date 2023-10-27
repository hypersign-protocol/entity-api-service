import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
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
import { AddVerificationMethodDto } from '../dto/addVm.dto';
import getAppVault from 'src/app-auth/services/app-vault.service';

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
    Logger.log('createByClientSpec() method: starts....', 'DidService');

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
        Logger.error(
          'createByClientSpec() method: Invalid varifiactionRelationship method',
          'DidService',
        );
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
    Logger.log(
      'createByClientSpec() method: initialising edv service',
      'DidService',
    );
    await this.edvService.init(edvId);
    const docs = await this.edvService.getDecryptedDocument(edvDocId);
    const mnemonic: string = docs.mnemonic;
    Logger.log(
      'createByClientSpec() method: initialising hypersignDid',
      'DidService',
    );
    const hypersignDid = await this.didSSIService.initiateHypersignDid(
      mnemonic,
      createDidDto.namespace,
    );
    let clientSpec: IClientSpec;
    Logger.log(
      `createByClientSpec() method:keyType is ${keyType}`,
      'DidService',
    );
    if (keyType) {
      if (keyType === IKeyType.EcdsaSecp256k1RecoveryMethod2020) {
        clientSpec = IClientSpec['eth-personalSign'];
      } else if (keyType === IKeyType.EcdsaSecp256k1VerificationKey2019) {
        clientSpec = IClientSpec['cosmos-ADR036'];
      } else {
        throw new BadRequestException([`Invalid KeyType ${keyType}`]);
      }
    }
    Logger.log(
      'createByClientSpec() method: before calling hypersignDid.createByClientSpec',
      'DidService',
    );
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
    Logger.log('createByClientSpec() method: starts....', 'DidService');

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
      const { edvId, kmsId } = appDetail;
      // Step 1: Generate a new menmonic
      const userWallet = await this.hidWallet.generateWallet();

      // Step 2: Create a DID using that mnemonic
      const hypersignDid = await this.didSSIService.initiateHypersignDid(
        userWallet.mnemonic,
        createDidDto.namespace,
      );

      const seed = await this.hidWallet.generateMnemonicToHDSeed();
      const { publicKeyMultibase, privateKeyMultibase } =
        await hypersignDid.generateKeys({ seed });
      const didDoc = await hypersignDid.generate({
        methodSpecificId,
        publicKeyMultibase,
        verificationRelationships,
      });

      // Step 3: Get app's vault using app's kmsId from kmsVault;
      /// get the app's menemonic from kmsvault and then form app's vault object
      const appVault = await getAppVault(kmsId, edvId);

      // Step 3: Store the menmonic and walletaddress in app's vault and get user's kmsId (docId)
      const userCredential = {
        mnemonic: userWallet.mnemonic,
        walletAddress: userWallet.address,
      };
      const userEdvDoc = appVault.prepareEdvDocument(userCredential, [
        { index: 'content.walletAddress', unique: false },
      ]);
      const { id: userKMSId } = await appVault.insertDocument(userEdvDoc);

      // Step 4: Store user's kmsId in DID db for that application. x
      await this.didRepositiory.create({
        did: didDoc.id,
        appId: appDetail.appId,
        kmsId: userKMSId,
        slipPathKeys: null,
        hdPathIndex: null,
        transactionHash: '',
        registrationStatus: RegistrationStatus.UNREGISTRED,
      });

      return {
        did: didDoc.id,
        registrationStatus: RegistrationStatus.UNREGISTRED,
        transactionHash: '',
        metaData: {
          didDocument: didDoc,
        },
      };
    } catch (e) {
      Logger.error(`create() method: Error: ${e.message}`, 'DidService');
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
    Logger.log('createByClientSpec() method: starts....', 'DidService');
    let registerDidDoc;
    const { edvId, edvDocId } = appDetail;
    Logger.log('register() method: initialising edv service', 'DidService');
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
    Logger.log(
      'register() method: initialising didSSIService service',
      'DidService',
    );
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
        kmsId: '',
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
      Logger.log(
        'register() method: before calling hypersignDid.register ',
        'DidService',
      );
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
    Logger.log('getDidList() method: starts....', 'DidService');

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
    Logger.log('getDidList() method: ends....', 'DidService');

    return didList;
  }

  async resolveDid(appDetail, did: string) {
    Logger.log('resolveDid() method: starts....', 'DidService');

    const didInfo = await this.didRepositiory.findOne({
      did,
    });
    let resolvedDid;
    if (didInfo !== null && didInfo.registrationStatus !== 'COMPLETED') {
      const { edvId, edvDocId } = appDetail;
      Logger.log('resolveDid() method: initialising edv service', 'DidService');
      await this.edvService.init(edvId);
      const docs = await this.edvService.getDecryptedDocument(edvDocId);
      const mnemonic: string = docs.mnemonic;
      const didSplitedArray = did.split(':'); // Todo Remove this worst way of doing it
      const namespace = didSplitedArray[2];
      const methodSpecificId = didSplitedArray[3];
      Logger.log(
        'resolveDid() method: initialising didSSIService service',
        'DidService',
      );
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
      Logger.log(
        'resolveDid() method: before calling hypersignDid.generate',
        'DidService',
      );
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
    Logger.log('updateDid() method: starts....', 'DidService');
    if (
      updateDidDto.didDocument['id'] == undefined ||
      updateDidDto.didDocument['id'] == ''
    ) {
      throw new BadRequestException('Invalid didDoc');
    }

    let updatedDid;
    Logger.debug(
      `updateDid() method: verificationMethod: ${updateDidDto.verificationMethodId}`,
      'DidService',
    );
    const hasKeyAgreementType =
      updateDidDto.didDocument.verificationMethod.some(
        (VM) =>
          VM.type === IKeyType.X25519KeyAgreementKey2020 ||
          VM.type === IKeyType.X25519KeyAgreementKeyEIP5630,
      );
    if (!hasKeyAgreementType) {
      updateDidDto.didDocument.keyAgreement = [];
    }
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
          Logger.log(
            'updateDid() method: before calling hypersignDid.updateByClientSpec to update did',
            'DidService',
          );
          updatedDid = await hypersignDid.updateByClientSpec({
            didDocument: updateDidDto.didDocument as Did,
            signInfos,
            versionId: updatedDidDocMetaData.versionId,
          });
        } else {
          Logger.log(
            'updateDid() method: before calling hypersignDid.deactivateByClientSpec to deactivate did',
            'DidService',
          );
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
          Logger.debug(
            'updateDid() method: before calling hypersignDid.update to update did',
            'DidService',
          );

          updatedDid = await hypersignDid.update({
            didDocument: updateDidDto.didDocument as Did,
            privateKeyMultibase,
            verificationMethodId: resolvedDid['verificationMethod'][0].id,
            versionId: updatedDidDocMetaData.versionId,
          });
        } else {
          Logger.debug(
            'updateDid() method: before calling hypersignDid.deactivate to deactivate did',
            'DidService',
          );

          updatedDid = await hypersignDid.deactivate({
            didDocument: updateDidDto.didDocument as Did,
            privateKeyMultibase,
            verificationMethodId: resolvedDid['verificationMethod'][0].id,
            versionId: updatedDidDocMetaData.versionId,
          });
        }
      } catch (error) {
        Logger.error(
          `updateDid() method: Error: ${error.message}`,
          'DidService',
        );
        throw new BadRequestException([error.message]);
      }
    }

    return { transactionHash: updatedDid.transactionHash };
  }

  async addVerificationMethod(
    addVMDto: AddVerificationMethodDto,
  ): Promise<Did> {
    Logger.log('addVerificationMethod() method: starts....', 'DidService');
    const hypersignDid = new HypersignDID();
    let result;
    try {
      result = await hypersignDid.addVerificationMethod({ ...addVMDto });
    } catch (e) {
      throw new BadRequestException([`${e.message}`]);
    }
    return result;
  }
}
