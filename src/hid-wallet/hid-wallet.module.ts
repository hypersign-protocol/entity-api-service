import { Module } from '@nestjs/common';
import { HidWalletService } from './services/hid-wallet.service';
@Module({
  controllers: [],
  providers: [HidWalletService],
})
export class HidWalletModule {}
