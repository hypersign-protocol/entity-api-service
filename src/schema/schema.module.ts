import { Module } from '@nestjs/common';
import { SchemaService } from './services/schema.service';
import { SchemaController } from './controllers/schema.controller';
import { EdvService } from 'src/edv/services/edv.service';
import { EdvModule } from 'src/edv/edv.module';
import { MongooseModule } from '@nestjs/mongoose';
import { SchemaRepository } from './repository/schema.repository';
import { DidRepository } from 'src/did/repository/did.repository';
import { Schemas, SchemasSchema } from './schema/schemas.schema';
import { HidWalletModule } from 'src/hid-wallet/hid-wallet.module';
import { HidWalletService } from 'src/hid-wallet/services/hid-wallet.service';
import { SchemaSSIService } from './services/schema.ssi.service';
import { ConfigService } from '@nestjs/config';
import { DidModule } from 'src/did/did.module';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Schemas.name, schema: SchemasSchema }]),
    EdvModule,
    HidWalletModule,
    DidModule,
  ],
  controllers: [SchemaController],
  providers: [
    SchemaService,
    EdvService,
    SchemaRepository,
    HidWalletService,
    DidRepository,
    SchemaSSIService,
    ConfigService,
  ],
})
export class SchemaModule {}
