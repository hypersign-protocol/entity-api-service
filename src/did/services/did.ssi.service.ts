import { Injectable, Logger, Scope } from '@nestjs/common';

import { HypersignDID } from 'hs-ssi-sdk';

import { ConfigService } from '@nestjs/config';
import { HidWalletService } from '../../hid-wallet/services/hid-wallet.service';

@Injectable({ scope: Scope.REQUEST })
export class DidSSIService {
  constructor(
    private readonly config: ConfigService,
    private readonly hidWallet: HidWalletService,
  ) {}

  async initiateHypersignDid(mnemonic: string, namespace: string) {
    Logger.log('InitateHypersignDid(): starts....', 'DidSSIService');

    const nodeRpcEndpoint = this.config.get('HID_NETWORK_RPC');
    const nodeRestEndpoint = this.config.get('HID_NETWORK_API');
    await this.hidWallet.generateWallet(mnemonic);
    Logger.log(
      'initiateHypersignDid() method: before getting offlinesigner',
      'DidSSIService',
    );
    const offlineSigner = this.hidWallet.getOfflineSigner();
    const hypersignDid = new HypersignDID({
      offlineSigner,
      nodeRpcEndpoint,
      nodeRestEndpoint,
      namespace: namespace,
    });
    await hypersignDid.init();
    return hypersignDid;
  }

  async initiateHypersignDidOffline(namespace: string) {
    Logger.log('InitateHypersignDid(): starts....', 'DidSSIService');

    const nodeRpcEndpoint = this.config.get('HID_NETWORK_RPC');
    const nodeRestEndpoint = this.config.get('HID_NETWORK_API');
    const hypersignDid = new HypersignDID({
      nodeRpcEndpoint,
      nodeRestEndpoint,
      namespace: namespace,
    });
    return hypersignDid;
  }
}
