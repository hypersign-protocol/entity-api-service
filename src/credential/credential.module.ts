import { Module } from '@nestjs/common';
import { CredentialService } from './services/credential.service';
import { CredentialController } from './controllers/credential.controller';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { Credential, CredentialSchema } from './schemas/credntial.schema';
import { CredentialSSIService } from './services/credential.ssi.service';
import { EdvService } from 'src/edv/services/edv.service';
import { EdvModule } from 'src/edv/edv.module';
import { HidWalletModule } from 'src/hid-wallet/hid-wallet.module';
import { HidWalletService } from 'src/hid-wallet/services/hid-wallet.service';
import { CredentialRepository } from './repository/credential.repository';
import { DidModule } from 'src/did/did.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Credential.name,
        schema: CredentialSchema,
      },
    ]),
    EdvModule,
    HidWalletModule,
    DidModule,
  ],
  controllers: [CredentialController],
  providers: [
    CredentialService,
    CredentialSSIService,
    EdvService,
    HidWalletService,
    CredentialRepository,
  ],
})
export class CredentialModule {}
