import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EdvModule } from './edv/edv.module';
import { AllExceptionsFilter } from './utils/utils';
import { APP_FILTER } from '@nestjs/core';
import { DidModule } from './did/did.module';
import { SchemaModule } from './schema/schema.module';
import { CredentialModule } from './credential/credential.module';
import { PresentationModule } from './presentation/presentation.module';
import { RedisConnectorModule } from './redis-connector/redis-connector.module';
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
    RedisConnectorModule,
  ],
  controllers: [],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
