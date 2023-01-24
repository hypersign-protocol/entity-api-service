import { Injectable, Scope } from '@nestjs/common';
import { HypersignSchema } from 'hs-ssi-sdk';
import { ConfigService } from '@nestjs/config';
import { HidWalletService } from 'src/hid-wallet/services/hid-wallet.service';

@Injectable({ scope: Scope.REQUEST })
export class SchemaSSIService {
  constructor(
    private readonly config: ConfigService,
    private readonly hidWallet: HidWalletService,
  ) {}
  async initiateHypersignSchema(mnemonic: string) {
    const nodeRpcEndpoint = this.config.get('HID_NETWORK_RPC');
    const nodeRestEndpoint = this.config.get('HID_NETWORK_API');
    const nameSpace = this.config.get('HID_NETWORK_NAMESPACE');
    await this.hidWallet.generateWallet(mnemonic);
    const offlineSigner = this.hidWallet.getOfflineSigner();
    const hypersignSchema = new HypersignSchema({
      offlineSigner,
      nodeRpcEndpoint,
      nodeRestEndpoint,
      nameSpace,
    });
    await hypersignSchema.init();
    return hypersignSchema;
  }
}
