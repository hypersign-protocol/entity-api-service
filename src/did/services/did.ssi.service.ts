import { Injectable, Scope } from '@nestjs/common';

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
    const nodeRpcEndpoint = this.config.get('HID_NETWORK_RPC');
    const nodeRestEndpoint = this.config.get('HID_NETWORK_API');
    await this.hidWallet.generateWallet(mnemonic);
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
}
