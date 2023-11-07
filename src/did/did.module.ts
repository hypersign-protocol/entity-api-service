import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { DidService } from './services/did.service';
import { DidController } from './controllers/did.controller';
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
import { AppAuthModule } from 'src/app-auth/app-auth.module';
import { WhitelistSSICorsMiddleware } from 'src/utils/middleware/cors.middleware';
import { TrimMiddleware } from 'src/utils/middleware/trim.middleware';
import { MongooseConfigService } from 'src/mongoose/mongoose.service';
import { ConfigModule } from '@nestjs/config';
import { databaseProviders } from '../mongoose/tenant-mongoose-connections';
import { didProviders } from './providers/did.provider';
@Module({
  imports: [EdvModule, HidWalletModule, AppAuthModule],
  controllers: [DidController],
  providers: [
    DidService,
    DidRepository,
    DidMetaDataRepo,
    HidWalletService,
    DidSSIService,
    ...databaseProviders,
    ...didProviders,
  ],
  exports: [
    DidService,
    DidRepository,
    DidMetaDataRepo,
    HidWalletService,
    DidSSIService,
  ],
})
export class DidModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(WhitelistSSICorsMiddleware).forRoutes(DidController);
    consumer
      .apply(TrimMiddleware)
      .exclude(
        { path: 'did', method: RequestMethod.GET },
        { path: 'did/:did', method: RequestMethod.GET },
      )
      .forRoutes(DidController);
  }
}
