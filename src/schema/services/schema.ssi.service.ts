import { Injectable, Scope } from '@nestjs/common';

import { HypersignSchema } from 'hs-ssi-sdk';

import { ConfigService } from '@nestjs/config';
import { HidWalletService } from '../../hid-wallet/services/hid-wallet.service';

@Injectable({ scope: Scope.REQUEST })
export class SchemaSSIService {
  constructor(
    private readonly config: ConfigService,
    private readonly hidWallet: HidWalletService,
  ) {}

  async initiateHypersignSchema(mnemonic: string, namespace: string) {
    const nodeRpcEndpoint = this.config.get('HID_NETWORK_RPC');
    const nodeRestEndpoint = this.config.get('HID_NETWORK_API');
    await this.hidWallet.generateWallet(mnemonic);
    const offlineSigner = this.hidWallet.getOfflineSigner();
    const hypersignSchema = new HypersignSchema({
      offlineSigner,
      nodeRpcEndpoint,
      nodeRestEndpoint,
      namespace: namespace,
    });
    await hypersignSchema.init();
    return hypersignSchema;
  }
}
