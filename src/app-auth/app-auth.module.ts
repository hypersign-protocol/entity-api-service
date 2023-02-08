import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppAuthService } from './services/app-auth.service';
import {  AppAuthController, AppOAuthController } from './controllers/app-auth.controller';
import { ValidateHeadersMiddleware } from './middlewares/validate-headers.middleware';
import { MongooseModule } from '@nestjs/mongoose';
import { App, AppSchema } from './schemas/app.schema';

import { AppRepository } from './repositories/app.repository';
import { HidWalletService } from 'src/hid-wallet/services/hid-wallet.service';
import { HidWalletModule } from 'src/hid-wallet/hid-wallet.module';
import { EdvModule } from 'src/edv/edv.module';
import { EdvService } from 'src/edv/services/edv.service';
import { AppAuthSecretService } from './services/app-auth-passord.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy/jwt.strategy';
import { KeyService } from './services/app-auth-key.service';
import { ApiSecretSchema, ApiSecret } from './schemas/app-apikey.schema';
import { ApiKeyRepository } from './repositories/app-apikey.repository';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: App.name, schema: AppSchema },{
      name:ApiSecret.name,schema:ApiSecretSchema
    }]),

    HidWalletModule,
    EdvModule,
    
    JwtModule.register({}),
  ],
  providers: [
    AppAuthService,
    AppRepository,
    HidWalletService,
    EdvService,
    AppAuthSecretService,
    JwtStrategy,KeyService,
    ApiKeyRepository
    
  ],
  controllers: [AppAuthController,AppOAuthController],
})
export class AppAuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    //// Appy middleware on all routes
    consumer.apply(ValidateHeadersMiddleware).forRoutes(AppAuthController);

    //// or Apply on specific routes
    // consumer.apply(ValidateHeadersMiddleware).forRoutes({
    //     path: '/app-auth/register',
    //     method: RequestMethod.POST,
    // })
  }
}
