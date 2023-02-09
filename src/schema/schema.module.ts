import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SchemaService } from './services/schema.service';
import { SchemaController } from './controllers/schema.controller';
import { SchemaSSIService } from './services/schema.ssi.service';
import { HidWalletService } from 'src/hid-wallet/services/hid-wallet.service';
import { EdvService } from 'src/edv/services/edv.service';
import { DidService } from 'src/did/services/did.service';
import { DidModule } from 'src/did/did.module';
import { SchemaRepository } from './repository/schema.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Schemas, SchemasSchema } from './schemas/schemas.schema';
import { WhitelistMiddleware } from 'src/utils/middleware/cors.middleware';
import { AppAuthModule } from 'src/app-auth/app-auth.module';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Schemas.name, schema: SchemasSchema }]),
    DidModule,
    AppAuthModule,
  ],
  controllers: [SchemaController],
  providers: [
    SchemaService,
    SchemaSSIService,
    DidService,
    EdvService,
    HidWalletService,
    SchemaRepository,
  ],
  exports: [SchemaModule],
})
export class SchemaModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    //// Appy middleware on all routes
    consumer.apply(WhitelistMiddleware).forRoutes(SchemaController);
  }
}
