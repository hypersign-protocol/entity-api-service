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
import { WhitelistSSICorsMiddleware } from 'src/utils/middleware/cors.middleware';
import { TrimMiddleware } from 'src/utils/middleware/trim.middleware';
import { databaseProviders } from '../mongoose/tenant-mongoose-connections';
import { didProviders } from './providers/did.provider';
import { JwtStrategy } from '../utils/jwt.strategy';
@Module({
  imports: [EdvModule, HidWalletModule],
  controllers: [DidController],
  providers: [
    JwtStrategy,
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
