import { Injectable } from '@nestjs/common';
import { EdvClientManger, IEdvClientManager } from './edvClientManager';
import { VaultWallet } from './vaultWalletManager';

@Injectable()
export class EdvClientManagerFactoryService {
  // It can either accept keys, diddoc or it can except a mnemonic.
  static async createEdvClientManger(
    vaultwallet: VaultWallet,
    edvId?: string,
  ): Promise<IEdvClientManager> {
    return new EdvClientManger(vaultwallet, edvId).initate();
  }
}
