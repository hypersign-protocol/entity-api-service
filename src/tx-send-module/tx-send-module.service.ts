import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import {
  MsgRegisterDID,
  MsgRegisterCredentialStatus,
} from 'hs-ssi-sdk/build/libs/generated/ssi/tx';
import { DidSSIService } from 'src/did/services/did.ssi.service';
import { HidWalletService } from 'src/hid-wallet/services/hid-wallet.service';
import { StdFee } from '@cosmjs/stargate';
import {
  MsgExec,
  MsgGrant,
  MsgRevoke,
} from 'cosmjs-types/cosmos/authz/v1beta1/tx';

@Injectable()
export class TxSendModuleService {
  private channel: ChannelWrapper;
  private granterAddress;
  constructor(
    private readonly configService: ConfigService,
    private readonly hidWalletService: HidWalletService,
    private readonly didSSIService: DidSSIService,
  ) {
    this.connect();
  }

  async invokeTxnController(address, granteeMnemonic) {
    await this.channel.sendToQueue(
      'DID_TXN_QUEUE_' + address,
      Buffer.from(null),
    );
    await this.channel.sendToQueue(
      'CRED_TXN_QUEUE_' + address,
      Buffer.from(null),
    );

    const podENV = {
      RMQ_URL: this.configService.get('RABBIT_MQ_URI'),
      DID_QUEUE_NAME: 'DID_TXN_QUEUE_' + address,
      CRED_QUEUE_NAME: 'CRED_TXN_QUEUE_' + address,
      NODE_RPC_URL: this.configService.get('HID_NETWORK_RPC'),
      GRANTEE_MNEMONIC: granteeMnemonic,
      GRANTER_ADDRESS: this.granterAddress,
      DID_REGISTER_FIXED_FEE: '50',
      CRED_REGISTER_FIXED_FEE: '50',
      SCHEMA_CREATE_FIXED_FEE: '50',
      ESTIMATE_GAS_PRICE: '155303',
      podName: 'txn-dynamic',
      granteeWalletAddress: address,
    };

    await this.channel.assertQueue('GLOBAL_TXN_CONTROLLER_QUEUE', {
      durable: false,
    });
    const sendToQueue2 = await this.channel.sendToQueue(
      this.configService.get('GLOBAL_TXN_CONTROLLER_QUEUE'),
      Buffer.from(JSON.stringify(podENV)),
    );
    console.log(sendToQueue2);
  }

  async prepareMsgCreateDID(
    didDocument,
    didDocumentSigned,
    verificationMethodId,
    txAuthor,
  ): Promise<MsgRegisterDID> {
    const proof = didDocumentSigned?.find((e) => {
      return e.verification_method_id === verificationMethodId;
    });

    const vm = didDocument.verificationMethod?.find((e) => {
      return e.id == verificationMethodId;
    });
    let signatureType = '';
    let proofPurpose = '';
    switch (vm.type) {
      case 'Ed25519VerificationKey2020': {
        signatureType = 'Ed25519Signature2020';
        proofPurpose = 'assertionMethod';

        break;
      }
      default: {
        throw Error('Type is not matched');
      }
    }

    return MsgRegisterDID.fromPartial({
      didDocument: didDocument,
      didDocumentProofs: [
        {
          verificationMethod: verificationMethodId,
          type: signatureType,
          proofPurpose: proofPurpose,
          created: proof.created,
          proofValue: proof.signature,
        },
      ],
      txAuthor: txAuthor,
    });
  }

  async connect() {
    Logger.log('Connecting Rabbit');
    const connection = await amqp.connect(
      this.configService.get('RABBIT_MQ_URI'),
    );
    this.channel = await connection.createChannel();
    const { address: granterAddress } =
      await this.hidWalletService.generateWallet(
        this.configService.get('MNEMONIC'),
      );
    this.granterAddress = granterAddress;
    Logger.log('Connected Rabbit');
  }

  async prepareRegisterCredentialStatus(
    credentialStatus,
    credentialStatusProof,
    txAuthor,
  ) {
    return MsgRegisterCredentialStatus.fromPartial({
      credentialStatusDocument: credentialStatus,
      credentialStatusProof: credentialStatusProof,
      txAuthor,
    });
  }

  async sendVCTxn(credentialStatus, credentialStatusProof, granteeMnemonic) {
    if (!this.channel) {
      await this.connect();
    }
    const { wallet, address } = await this.hidWalletService.generateWallet(
      granteeMnemonic,
    );

    const msgRegisterCredentialStatus =
      await this.prepareRegisterCredentialStatus(
        credentialStatus,
        credentialStatusProof,
        address,
      );
    const authExecMsg: MsgExec = {
      grantee: address,
      msgs: [
        {
          typeUrl: '/hypersign.ssi.v1.MsgRegisterCredentialStatus',
          value: MsgRegisterCredentialStatus.encode(
            msgRegisterCredentialStatus,
          ).finish(),
        },
      ],
    };

    const fee = {
      amount: [
        {
          denom: 'uhid',
          amount: '100',
        },
      ],
      gas: '500000',
      granter: this.granterAddress, // NOTE: It is VERY IMPORTANT to explicitly pass granter's address
    };

    const txMsg = {
      typeUrl: '/cosmos.authz.v1beta1.MsgExec',
      value: authExecMsg,
    };

    const queue = 'CRED_TXN_QUEUE_' + address;
    await this.channel.assertQueue(queue, {
      durable: false,
    });

    const sendToQueue1 = await this.channel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(txMsg)),
    );

    await this.invokeTxnController(address, granteeMnemonic);
    console.log(sendToQueue1);
  }

  async sendDIDTxn(
    didDocument,
    didDocumentSigned,
    verificationMethodId,
    granteeMnemonic,
  ) {
    if (!this.channel) {
      await this.connect();
    }

    const { wallet, address } = await this.hidWalletService.generateWallet(
      granteeMnemonic,
    );
    const msgCreateDID = await this.prepareMsgCreateDID(
      didDocument,
      didDocumentSigned,
      verificationMethodId,
      address,
    );

    const authExecMsg: MsgExec = {
      grantee: address,
      msgs: [
        {
          typeUrl: '/hypersign.ssi.v1.MsgRegisterDID',
          value: MsgRegisterDID.encode(msgCreateDID).finish(),
        },
      ],
    };
    const fee = {
      amount: [
        {
          denom: 'uhid',
          amount: '100',
        },
      ],
      gas: '500000',
      granter: this.granterAddress, // NOTE: It is VERY IMPORTANT to explicitly pass granter's address
    };
    const txMsg = {
      typeUrl: '/cosmos.authz.v1beta1.MsgExec',
      value: authExecMsg,
    };
    const queue = 'DID_TXN_QUEUE_' + address;
    await this.channel.assertQueue(queue, {
      durable: false,
    });

    const sendToQueue1 = await this.channel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(txMsg)),
    );
    await this.invokeTxnController(address, granteeMnemonic);
    console.log(sendToQueue1);
  }
}
