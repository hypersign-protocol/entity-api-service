import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EdvModule } from './edv/edv.module';
import { AllExceptionsFilter } from './utils/utils';
import { APP_FILTER } from '@nestjs/core';
import { DidModule } from './did/did.module';
import { SchemaModule } from './schema/schema.module';
import { CredentialModule } from './credential/credential.module';
import { PresentationModule } from './presentation/presentation.module';
import { TxSendModuleModule } from './tx-send-module/tx-send-module.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '',
      isGlobal: true,
    }),
    EdvModule,
    DidModule,
    SchemaModule,
    CredentialModule,
    PresentationModule,
    TxSendModuleModule,
  ],
  controllers: [],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
