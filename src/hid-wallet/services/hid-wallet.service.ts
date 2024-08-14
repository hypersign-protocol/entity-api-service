import { Injectable, Logger, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bip39, Slip10, Slip10RawIndex, Slip10Curve } from '@cosmjs/crypto';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';

@Injectable({ scope: Scope.REQUEST })
export class HidWalletService {
  private mnemonic;
  private offlineSigner;
  constructor(private configService: ConfigService) {}

  async generateWallet(mnemonic?: string): Promise<{
    mnemonic: string;
    wallet: DirectSecp256k1HdWallet;
    address: string;
  }> {
    Logger.log('generateWallet() method: starts....', 'generateWallet');

    this.mnemonic = mnemonic;

    let wallet: any;
    if (!mnemonic) {
      wallet = await DirectSecp256k1HdWallet.generate(24, {
        prefix: 'hid',
      });
    } else {
      wallet = await DirectSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
        prefix: 'hid',
      });
    }

    const generatedMnemonice = wallet.secret.data;
    this.offlineSigner = wallet;
    Logger.log(
      'generateWallet() method:fetching hid wallet address',
      'generateWallet',
    );

    const hidWalletAddress = await wallet.getAccounts();
    Logger.log('generateWallet() method: ends....', 'generateWallet');

    this.mnemonic = generatedMnemonice;
    return {
      mnemonic: generatedMnemonice,
      wallet: wallet,
      address: hidWalletAddress[0].address,
    };
  }
  getOfflineSigner() {
    return this.offlineSigner;
  }

  async generateMnemonicToHDSeed(minHardIndex = 0) {
    Logger.log(
      'generateMnemonicToHDSeed() method: starts....',
      'generateWallet',
    );

    if (this.mnemonic === undefined) {
      throw new Error('Mnemonic is undefined');
    }
    minHardIndex = minHardIndex + 1;
    const seed = Bip39.decode(this.mnemonic);

    const slipPathKeys = Slip10.derivePath(
      Slip10Curve.Ed25519,
      seed,
      this.makeSSIWalletPath(minHardIndex),
    );
    const seedHD = slipPathKeys.privkey;
    Logger.log('generateMnemonicToHDSeed() method: ends....', 'generateWallet');

    return seedHD;
  }

  async generateMemonicToSeedFromSlip10RawIndex(path: Array<Slip10RawIndex>) {
    Logger.log(
      'generateMemonicToSeedFromSlip10RawIndex() method: starts....',
      'generateWallet',
    );

    const seed = Bip39.decode(this.mnemonic);
    const slipPathKeys = Slip10.derivePath(Slip10Curve.Ed25519, seed, path);
    const seedHD = slipPathKeys.privkey;
    return seedHD;
  }

  makeSSIWalletPath(minHardIndex) {
    return [
      Slip10RawIndex.hardened(44),
      Slip10RawIndex.hardened(128),
      Slip10RawIndex.hardened(100),
      Slip10RawIndex.hardened(0),
      Slip10RawIndex.hardened(minHardIndex),
    ];
  }

  getSeedFromMnemonic(mnemonic = this.mnemonic) {
    return Bip39.decode(mnemonic);
  }
}
