import { Injectable } from '@nestjs/common';
import { HypersignEdvClient, HypersignCipher } from 'hypersign-edv-client';
import { X25519KeyAgreementKey2020 } from '@digitalbazaar/x25519-key-agreement-key-2020';
import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

interface IEd25519VerificationKey2020KeyPair {
  privateKeyMultibase: string;
  publicKeyMultibase: string;
}

@Injectable()
export class EdvService {
  private edvClient: HypersignEdvClient;
  private cipher: HypersignCipher;
  private edvId: string;
  private edvKey: string;
  private edvUrl: string;
  private edvKeyAgreementKey: X25519KeyAgreementKey2020;
  private edvHmac: any;
  private edvAuthnticationKey: Ed25519VerificationKey2020;
  private edvVerificationKey: Ed25519VerificationKey2020;
  private edvCapability: string;
  private edvCapabilityInvocationKey: string;
  private edvCapabilityInvocationKeyID: string;
  private edvCapabilityInvocationKeyController: string;

  private edvCapabilityInvocationKeyPublicKeyMultibase: string;
  private edvCapabilityInvocationKeyPrivateKeyMultibase: string;
  private edvCapabilityInvocationKeyPublicKeyJwk: string;
  private edvCapabilityInvocationKeyPrivateKeyJwk: string;

  constructor(private readonly configService: ConfigService) {
    this.edvUrl = this.configService.get('EDV_BASE_URL');
    this.edvId = 'hid:SSI:dummyEdv';
  }
  async setAuthenticationKey(
    Ed25519VerificationKey2020KeyPair: IEd25519VerificationKey2020KeyPair,
    authenticationKeyId: string,
    controller: string,
  ) {
    const key = {
      id:
        authenticationKeyId.split('#')[0] +
        '#' +
        Ed25519VerificationKey2020KeyPair.publicKeyMultibase,
      controller: controller,
      publicKeyMultibase: Ed25519VerificationKey2020KeyPair.publicKeyMultibase,
      privateKeyMultibase:
        Ed25519VerificationKey2020KeyPair.privateKeyMultibase,
    };

    const authenticationKey = {
      '@context': 'https://w3id.org/security/suites/x25519-2020/v1',
      ...key,
    };
    this.edvAuthnticationKey = await Ed25519VerificationKey2020.generate({
      ...authenticationKey,
    });
    this.edvCapabilityInvocationKeyPublicKeyMultibase =
      Ed25519VerificationKey2020KeyPair.publicKeyMultibase;
    this.edvCapabilityInvocationKeyPrivateKeyMultibase =
      Ed25519VerificationKey2020KeyPair.privateKeyMultibase;
    this.edvCapabilityInvocationKeyController = controller;
    this.edvCapabilityInvocationKeyID = key.id;
  }
  async hypersignDIDKeyResolverForEd25519KeyPair({ id }) {
    /* some how this setup does not work 
        const authenticationKey = {
            '@context': 'https://w3id.org/security/suites/x25519-2020/v1',
            id: id.split('#')[0] + '#' + this.edvCapabilityInvocationKeyPublicKeyMultibase,
            controller: this.edvCapabilityInvocationKeyController,
            publicKeyMultibase: this.edvCapabilityInvocationKeyPublicKeyMultibase,
            privateKeyMultibase: ''
        }*/

    let authserverDid: any = fs
      .readFileSync(process.env.EDV_DID_FILE_PATH)
      .toString();
    authserverDid = JSON.parse(authserverDid);
    let authserverKey: any = fs
      .readFileSync(process.env.EDV_KEY_FILE_PATH)
      .toString();
    authserverKey = JSON.parse(
      authserverKey,
    ) as IEd25519VerificationKey2020KeyPair;

    const authenticationKey = {
      '@context': 'https://w3id.org/security/suites/x25519-2020/v1',
      id: id.split('#')[0] + '#' + authserverKey.publicKeyMultibase,
      controller: authserverDid.id,
      publicKeyMultibase: authserverKey.publicKeyMultibase,
      privateKeyMultibase: '',
    };

    const ed25519KeyPair: Ed25519VerificationKey2020 =
      await Ed25519VerificationKey2020.generate({ ...authenticationKey });
    return ed25519KeyPair;
  }

  async init(edvId?: string) {
    const apiServerKeys = JSON.parse(
      fs.readFileSync(this.configService.get('EDV_KEY_FILE_PATH')).toString(),
    );
    const edvServiceDidDoc = JSON.parse(
      fs.readFileSync(this.configService.get('EDV_DID_FILE_PATH')).toString(),
    );
    await this.setAuthenticationKey(
      apiServerKeys,
      edvServiceDidDoc.authentication[0],
      edvServiceDidDoc.controller[0],
    );

    const config = {
      controller: this.edvCapabilityInvocationKeyController,
      keyAgreementKey: {
        id: this.edvCapabilityInvocationKeyID,
        type: 'X25519KeyAgreementKey2020',
      },
      hmac: {
        id: this.edvCapabilityInvocationKeyID,
        type: 'Sha256HmacKey2020',
      },
      edvId: edvId ? edvId : this.edvId,
    };
    this.edvId = config.edvId;
    const client = new HypersignEdvClient({
      keyResolver: this.hypersignDIDKeyResolverForEd25519KeyPair,
      url: this.edvUrl,
      ed25519VerificationKey2020: this.edvAuthnticationKey,
    });
    const data = await client.registerEdv(config);
    this.edvClient = client;
    return data;
  }

  public async createDocument(doc: object) {
    const { edvClient, edvId } = this;
    const resp = await edvClient.insertDoc({ document: doc, edvId });
    return resp;
  }

  public async updateDocument(doc: object, id: string) {
    const { edvClient, edvId } = this;
    return await edvClient.updateDoc({ document: doc, edvId, documentId: id });
  }

  public async getDocument(id: string) {
    const { edvClient, edvId } = this;
    return await edvClient.fetchDoc({ edvId, documentId: id });
  }

  public async getDecryptedDocument(id: string) {
    const { edvClient, edvId } = this;
    const doc = await edvClient.fetchDoc({ edvId, documentId: id });

    const decryptedDoc = await edvClient.hsCipher.decryptObject({
      jwe: JSON.parse(doc[0].encData),
    });
    return decryptedDoc;
  }
  public async deleteDoc(id: string) {
    const { edvClient } = this;
    return await edvClient.deleteDoc({ documentId: id });
  }
}
