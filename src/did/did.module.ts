import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DidService } from './services/did.service';
import { DidController } from './controllers/did.controller';
import { EdvService } from 'src/edv/services/edv.service';
import { EdvModule } from 'src/edv/edv.module';
import { DidMetaDataRepo, DidRepository } from './repository/did.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { DidSSIService } from './services/did.ssi.service';
import {
  Did,
  DidMetaData,
  DidMetaDataSchema,
  DidSchema,
} from './schemas/did.schema';
import { HidWalletModule } from 'src/hid-wallet/hid-wallet.module';
import { HidWalletService } from 'src/hid-wallet/services/hid-wallet.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Did.name, schema: DidSchema },
      { name: DidMetaData.name, schema: DidMetaDataSchema },
    ]),
    EdvModule,
    HidWalletModule,
  ],
  controllers: [DidController],
  providers: [
    DidService,
    EdvService,
    DidRepository,
    DidMetaDataRepo,
    HidWalletService,
    DidSSIService,
    
  ],
  exports: [DidService,
    EdvService,
    DidRepository,
    DidMetaDataRepo,
    HidWalletService,
    DidSSIService],
})
export class DidModule {

 
}


