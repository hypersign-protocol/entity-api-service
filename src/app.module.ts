import { Module } from '@nestjs/common';
import { AppAuthModule } from './app-auth/app-auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { EdvModule } from './edv/edv.module';
import { AllExceptionsFilter } from './utils/utils';
import { APP_FILTER } from '@nestjs/core';

import { AppAuthSecretService } from './app-auth/services/app-auth-passord.service';
import { DidModule } from './did/did.module';
import { SchemaModule } from './schema/schema.module';
@Module({
  imports: [
    AppAuthModule,
    ConfigModule.forRoot({
      envFilePath: '',
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.DATABASE_CONNECTION_PATH),

    EdvModule,
    DidModule,
    SchemaModule,
  ],
  controllers: [],
  providers: [
    AppAuthSecretService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
