import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { CredentialService } from './services/credential.service';
import { CredentialController } from './controllers/credential.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Credential, CredentialSchema } from './schemas/credntial.schema';
import { CredentialSSIService } from './services/credential.ssi.service';
import { EdvModule } from 'src/edv/edv.module';
import { HidWalletModule } from 'src/hid-wallet/hid-wallet.module';
import { HidWalletService } from 'src/hid-wallet/services/hid-wallet.service';
import { CredentialRepository } from './repository/credential.repository';
import { DidModule } from 'src/did/did.module';
import { WhitelistSSICorsMiddleware } from 'src/utils/middleware/cors.middleware';
import { TrimMiddleware } from 'src/utils/middleware/trim.middleware';
import { credentialProviders } from './providers/credential.provider';
import { databaseProviders } from '../mongoose/tenant-mongoose-connections';
import { AppAuthModule } from 'src/app-auth/app-auth.module';

@Module({
  imports: [EdvModule, HidWalletModule, DidModule, AppAuthModule],
  controllers: [CredentialController],
  providers: [
    CredentialService,
    CredentialSSIService,
    HidWalletService,
    CredentialRepository,
    ...databaseProviders,
    ...credentialProviders,
  ],
})
export class CredentialModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(WhitelistSSICorsMiddleware).forRoutes(CredentialController);
    consumer
      .apply(TrimMiddleware)
      .exclude(
        { path: 'credential', method: RequestMethod.GET },
        { path: 'credential/:credentialId', method: RequestMethod.GET },
      )
      .forRoutes(CredentialController);
  }
}
