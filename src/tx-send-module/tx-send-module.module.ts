import { Module } from '@nestjs/common';
import { TxSendModuleService } from './tx-send-module.service';
import { ConfigModule } from '@nestjs/config';
import { HidWalletModule } from 'src/hid-wallet/hid-wallet.module';
import { DidSSIService } from 'src/did/services/did.ssi.service';

@Module({
  imports: [ConfigModule, HidWalletModule],
  controllers: [],
  providers: [TxSendModuleService, DidSSIService],
  exports: [TxSendModuleService],
})
export class TxSendModuleModule {}
