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
import { Slip10RawIndex } from '@cosmjs/crypto';
import { HidWalletService } from '../../hid-wallet/services/hid-wallet.service';
import { DidSSIService } from './did.ssi.service';
import { RegistrationStatus } from '../schemas/did.schema';
import { RegisterDidDto } from '../dto/register-did.dto';
import { Did as IDidDto } from '../schemas/did.schema';
import { AddVerificationMethodDto } from '../dto/addVm.dto';
import { getAppVault, getAppMenemonic } from '../../utils/app-vault-service';
import { ConfigService } from '@nestjs/config';
import { RedisConnectorService } from 'src/redis-connector/redis-connector.service';

@Injectable({ scope: Scope.REQUEST })
export class DidService {
  constructor(
    private readonly didRepositiory: DidRepository,
    private readonly didMetadataRepository: DidMetaDataRepo,
    private readonly hidWallet: HidWalletService,
    private readonly didSSIService: DidSSIService,
    private readonly config: ConfigService,
    private readonly redisConnector: RedisConnectorService,
  ) {}

  // TODO: need to fix this once ed25519 is finished.
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

    const { edvId, kmsId } = appDetail;
    Logger.log(
      'createByClientSpec() method: initialising edv service',
      'DidService',
    );

    // TODO: we are not storing it in db wrt to the app, we need to
    // const appVault = await getAppVault(kmsId, edvId);

    Logger.log(
      'createByClientSpec() method: initialising hypersignDid',
      'DidService',
    );

    const hypersignDid = await this.didSSIService.initiateHypersignDidOffline(
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
    Logger.log('create() method: starts....', 'DidService');

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
      Logger.log('Before calling hidWallet.generateWallet()', 'DidService');
      const userWallet = await this.hidWallet.generateWallet();
      Logger.log('After calling hidWallet.generateWallet()', 'DidService');

      // Step 2: Create a DID using that mnemonic
      Logger.log(
        'Before calling didSSIService.initiateHypersignDid()',
        'DidService',
      );
      const hypersignDid = await this.didSSIService.initiateHypersignDid(
        userWallet.mnemonic,
        createDidDto.namespace,
      );
      Logger.log(
        'After calling didSSIService.initiateHypersignDid()',
        'DidService',
      );

      Logger.log(
        'Before calling .hidWallet.getSeedFromMnemonic()',
        'DidService',
      );
      const seed = await this.hidWallet.getSeedFromMnemonic(
        userWallet.mnemonic,
      );
      Logger.log(
        'After calling .hidWallet.getSeedFromMnemonic()',
        'DidService',
      );

      Logger.log('Before calling hypersignDid.generateKeys', 'DidService');
      const { publicKeyMultibase } = await hypersignDid.generateKeys({ seed });
      Logger.log('After calling hypersignDid.generateKeys', 'DidService');

      Logger.log('Before calling hypersignDid.generate()', 'DidService');
      const didDoc = await hypersignDid.generate({
        methodSpecificId,
        publicKeyMultibase,
        verificationRelationships,
      });
      Logger.log('After calling hypersignDid.generate()', 'DidService');

      if (!didDoc) {
        throw new Error('Could not generate dIDDoc');
      }
      // Step 3: Get app's vault using app's kmsId from kmsVault;
      /// get the app's menemonic from kmsvault and then form app's vault object
      Logger.log('Before calling getAppVault ', 'DidService');
      const appVault = await getAppVault(kmsId, edvId);
      Logger.log('After calling getAppVault ', 'DidService');
      if (!appVault) {
        throw new Error('KeyManager is not null or not initialized');
      }

      // Step 3: Store the menmonic and walletaddress in app's vault and get user's kmsId (docId)
      const userCredential = {
        mnemonic: userWallet.mnemonic,
        walletAddress: userWallet.address,
      };
      Logger.log('Before calling appVault.prepareEdvDocument() ', 'DidService');
      const userEdvDoc = appVault.prepareEdvDocument(userCredential, [
        { index: 'content.walletAddress', unique: false },
      ]);
      Logger.log('After calling appVault.prepareEdvDocument() ', 'DidService');

      Logger.log('Before calling appVault.insertDocument() ', 'DidService');
      const insertedDoc = await appVault.insertDocument(userEdvDoc);
      Logger.log('After calling appVault.insertDocument() ', 'DidService');

      Logger.log(JSON.stringify(insertedDoc), 'DidService');
      if (!insertedDoc) {
        throw new Error(
          'Could not insert document for userCredential.walletAddress' +
            userCredential.walletAddress,
        );
      }
      const { id: userKMSId } = insertedDoc;

      // Step 4: Store user's kmsId in DID db for that application. x
      Logger.log(
        'Before calling didRepositiory.create() did ' + didDoc.id,
        'DidService',
      );
      await this.didRepositiory.create({
        did: didDoc.id,
        appId: appDetail.appId,
        kmsId: userKMSId,
        slipPathKeys: null,
        hdPathIndex: null,
        transactionHash: '',
        registrationStatus: RegistrationStatus.UNREGISTRED,
        name: createDidDto.options?.name,
      });
      Logger.log(
        'After calling didRepositiory.create() did ' + didDoc.id,
        'DidService',
      );

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
    const { edvId, kmsId } = appDetail;
    Logger.log('register() method: initialising edv service', 'DidService');

    // TODO: Once we implemnt authz, we can ask user' to do this tranction
    const appMenemonic = await getAppMenemonic(kmsId);
    const namespace = this.config.get('NETWORK')
      ? this.config.get('NETWORK')
      : 'testnet';
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
      appMenemonic,
      namespace,
    );
    let data;
    const { didDocument, signInfos, verificationMethodId } = registerDidDto;

    if (!verificationMethodId && signInfos) {
      const txnMesage = await hypersignDid.generateRegisterDidTxnMessage(
        didDocument,
        signInfos,
      );

      delete signInfos[0]['verification_method_id'];

      signInfos[0]['proofPurpose'] = 'assertionMethod';
      signInfos[0]['verificationMethod'] = didDocument.verificationMethod[0].id;
      signInfos[0]['proofValue'] = signInfos[0]['signature'];
      delete signInfos[0]['signature'];

      signInfos[0]['type'] = 'Ed25519Signature2020';

      this.redisConnector.sendDidTxn(txnMesage, didDocument.id);

      // registerDidDoc = await hypersignDid.registerByClientSpec({
      //   didDocument,
      //   signInfos,
      // });

      data = await this.didRepositiory.create({
        did: didDocument['id'],
        appId: appDetail.appId,
        slipPathKeys: null,
        hdPathIndex: null,
        kmsId: DidInfo.kmsId,
        transactionHash:
          registerDidDoc && registerDidDoc?.transactionHash
            ? registerDidDoc.transactionHash
            : '',
        registrationStatus:
          registerDidDoc && registerDidDoc?.transactionHash
            ? RegistrationStatus.COMPLETED
            : RegistrationStatus.UNREGISTRED,
        name: DidInfo.name,
      });
    } else {
      const didData = await this.didRepositiory.findOne({
        did: didDocument['id'],
      });
      if (!didData) {
        throw new NotFoundException([didDocument['id'] + ' not found']);
      }

      const appVault = await getAppVault(kmsId, edvId);
      const { mnemonic: userMnemonic } = await appVault.getDecryptedDocument(
        didData.kmsId,
      );

      const seed = await this.hidWallet.getSeedFromMnemonic(userMnemonic);
      const { privateKeyMultibase, publicKeyMultibase } =
        await hypersignDid.generateKeys({
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
      // registerDidDoc = await hypersignDid.register(params);

      const signInfos = await hypersignDid.createSignInfos(params);
      delete signInfos[0]['verification_method_id'];

      signInfos[0]['proofPurpose'] = 'assertionMethod';
      signInfos[0]['verificationMethod'] = didDocument.verificationMethod[0].id;
      signInfos[0]['proofValue'] = signInfos[0]['signature'];
      delete signInfos[0]['signature'];

      signInfos[0]['type'] = 'Ed25519Signature2020';
      console.log(signInfos);

      const txnMesage = await hypersignDid.generateRegisterDidTxnMessage(
        didDocument,
        signInfos,
      );

      txnMesage['value']['didDocumentProofs'] = signInfos;
      txnMesage['value']['txAuthor'] = this.config.get('TXN_AUTHOR');
      console.log(JSON.stringify(txnMesage, null, 2));

      this.redisConnector.sendDidTxn(txnMesage, didDocument.id);

      // push txnMessage to redis

      data = await this.didRepositiory.findOneAndUpdate(
        { did: didDocument['id'] },
        {
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
      const { edvId, kmsId } = appDetail;
      Logger.log('resolveDid() method: initialising edv service', 'DidService');

      const mnemonic = await getAppMenemonic(kmsId);
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
        name: didInfo.name,
      };
      resolvedDid = tempResolvedDid;
    } else {
      const hypersignDid = new HypersignDID();
      resolvedDid = await hypersignDid.resolve({ did });
      resolvedDid['name'] = didInfo?.name;
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
      const { edvId, kmsId } = appDetail;

      const mnemonic = await getAppMenemonic(kmsId);
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
      const { edvId, kmsId } = appDetail;

      const { mnemonic: appMenemonic } =
        await global.kmsVault.getDecryptedDocument(kmsId);
      const namespace = this.config.get('NETWORK')
        ? this.config.get('NETWORK')
        : 'testnet';

      const hypersignDid = await this.didSSIService.initiateHypersignDid(
        appMenemonic,
        namespace,
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

      const appVault = await getAppVault(kmsId, edvId);
      const { mnemonic: userMnemonic } = await appVault.getDecryptedDocument(
        didInfo.kmsId,
      );
      const seed = await this.hidWallet.getSeedFromMnemonic(userMnemonic);
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
