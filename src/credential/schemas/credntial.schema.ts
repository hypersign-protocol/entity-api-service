import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { IsDid } from 'src/utils/customDecorator/did.decorator';
import { IsVcId } from 'src/utils/customDecorator/vc.decorator';

export type CredentialModel = Credential & Document;

@Schema()
export class Credential {
  @IsString()
  @Prop({ required: true })
  appId: string;

  @IsString()
  @Prop({ required: true })
  @IsVcId()
  credentialId: string;

  @IsString()
  @IsDid()
  @Prop({ required: true })
  issuerDid: string;

  @IsString()
  @IsOptional()
  @Prop()
  edvDocId: string;

  @IsBoolean()
  @Prop({ required: true })
  persist: boolean;

  @IsString()
  @Prop()
  transactionHash: string;

  @IsString()
  @Prop()
  type: string;
}

const CredentialSchema = SchemaFactory.createForClass(Credential);
CredentialSchema.index(
  { appId: 1, credentialId: 1, issuerDid: 1 },
  { unique: true },
);
CredentialSchema.index({ credentialId: 1, issuerDid: 1 }, { unique: true });
CredentialSchema.index({ credentialId: 1 }, { unique: true });

export { CredentialSchema };
