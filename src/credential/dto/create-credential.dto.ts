import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ValidateVerificationMethodId } from 'src/utils/customDecorator/vmId.decorator';
import { IsDid } from 'src/utils/customDecorator/did.decorator';
import { IsSchemaId } from 'src/utils/customDecorator/schemaId.deceorator';
import { IsVcId } from 'src/utils/customDecorator/vc.decorator';

export class CreateCredentialDto {
  @ApiProperty({
    name: 'schemaId',
    description: 'schemaId for credential Schema',
    required: false,
  })
  @IsOptional()
  @IsString()
  schemaId: string;

  @ApiProperty({
    name: 'subjectDid',
    description: 'holder did of the credential',
  })
  @IsString()
  @IsNotEmpty()
  @IsDid()
  subjectDid: string;
  @ApiProperty({
    name: 'issuerDid',
    description: 'issuerDid of the credential',
  })
  @IsString()
  @IsNotEmpty()
  @IsDid()
  issuerDid: string;

  @ApiHideProperty()
  @IsOptional()
  subjectDidDocSigned?: JSON;

  @ApiHideProperty()
  @IsOptional()
  schemaContext: Array<string>;
  @ApiHideProperty()
  @IsOptional()
  type: Array<string>;

  @ApiProperty({
    name: 'expirationDate',
    description: 'Date in ISOString format',
    example: '2027-12-10T18:30:00.000Z',
  })
  @IsString()
  @IsNotEmpty()
  expirationDate: string;

  @ApiProperty({
    name: 'fields',
    description: 'Credential Data fields',
    example: {
      name: 'Random name',
    },
  })
  @IsNotEmptyObject()
  fields: object;

  @ApiProperty({
    name: 'namespace',
    description: 'Namespace to be added in did.',
    example: 'testnet',
  })
  @IsString()
  @IsNotEmpty()
  namespace: string;

  @ApiProperty({
    description: 'Verification Method id for did updation',
    example: 'did:hid:testnet:........#key-${idx}',
  })
  @ValidateVerificationMethodId()
  @IsString()
  @IsNotEmpty()
  verificationMethodId: string;

  @ApiProperty({
    name: 'persist',
    description: 'Persist in edv',
    example: 'true',
  })
  @IsBoolean()
  persist: boolean;
}

export class CredentialSubject {
  @ApiProperty({
    description: 'id',
    example: 'did:hid:testnet:...............',
  })
  @IsString()
  @IsDid()
  id: string;
}
export class CredentialSchema {
  @ApiProperty({
    description: 'id',
    example: 'sch:hid:testnet:...............',
  })
  @IsString()
  @IsNotEmpty()
  @IsSchemaId()
  id: string;
  @ApiProperty({
    name: 'type',
    description: 'type of schema',
    example: 'JsonSchemaValidator2018',
  })
  @IsString()
  type: string;
}
class CredentialStatus {
  @ApiProperty({
    description: 'id',
    example:
      'https://api.jagrat.hypersign.id/hypersign-protocol/hidnode/ssi/credential/vc:hid:testnet:...............',
  })
  @IsString()
  id: string;
  @ApiProperty({
    name: 'type',
    description: 'type of credential',
    example: 'CredentialStatusList2017',
  })
  @IsString()
  type: string;
}

export class CredentialProof {
  @ApiProperty({
    name: 'type',
    description: 'type using which credential has signed',
    example: 'Ed25519Signature2020',
  })
  @IsString()
  type: string;
  @ApiProperty({
    name: 'created',
    description: 'Date on which credential has issued',
    example: '2023-01-25T17:01:02Z',
  })
  @IsString()
  created: Date;
  @ApiProperty({
    name: 'verificationMethod',
    description: 'Verification id using which credential has signed',
    example: 'did:hid:testnet:...............#key-${id}',
  })
  @IsString()
  @ValidateVerificationMethodId()
  verificationMethod: string;
  @ApiProperty({
    name: 'proofPurpose',
    description: '',
    example: 'assertionMethod',
  })
  @IsString()
  proofPurpose: Date;
  @ApiProperty({
    name: 'proofValue',
    description: '',
    example: 'z5LairjrBYkc5FtP.......................EXFHm37aDvcMtCvnYfmvQ',
  })
  @IsString()
  proofValue: string;
}

class Claim {
  @ApiProperty({
    name: 'id',
    description: 'Credential id',
    example: 'vc:hid:testnet:................',
  })
  @IsString()
  @IsVcId()
  id: string;
  @ApiProperty({
    name: 'currentStatus',
    description: 'Status of credential',
    example: 'vc:hid:testnet:................',
  })
  currentStatus: string;
  @ApiProperty({
    name: 'statusReason',
    description: 'Reason of current status',
    example: 'Credential is active',
  })
  statusReason: string;
}
class CredStatus {
  @ApiProperty({
    name: 'claim',
    description: ' ',
    type: Claim,
  })
  claim: Claim;
  @ApiProperty({
    name: 'issuer',
    description: 'did of the one who issue the credential',
    example: 'did:hid:testnet:..............',
  })
  @IsString()
  @IsDid()
  issuer: string;
  @ApiProperty({
    name: 'issuanceDate',
    description: 'Date on which credential hasa issued',
    example: '2023-01-25T16:59:21Z',
  })
  @IsString()
  issuanceDate: Date;
  @ApiProperty({
    name: 'expirationDate',
    description: 'Date on which credential will expire',
    example: '2023-01-25T16:59:21Z',
  })
  @IsString()
  expirationDate: Date;
  @ApiProperty({
    name: 'credentialHash',
    description: 'Hash of credential',
    example: 'ae93886f2a............3f6d1c6ae4..........393d43730',
  })
  @IsString()
  credentialHash: string;
}
export class CredDoc {
  @ApiProperty({
    description: 'Context',
    example: [
      'https://www.w3.org/2018/credentials/v1',
      {
        hs: 'https://api.jagrat.hypersign.id/hypersign-protocol/hidnode/ssi/schema/sch:hid:testnet:...........:1.0:',
      },
      {
        name: 'hs:name',
      },
      'https://w3id.org/security/suites/ed25519-2020/v1',
    ],
  })
  '@context': Array<string>;
  @ApiProperty({
    description: 'id',
    example: 'vc:hid:testnet:......',
  })
  @IsString()
  @IsVcId()
  id: string;
  @ApiProperty({
    description: 'type',
    example: ['VerifiableCredential', 'nameschema'],
    isArray: true,
  })
  @IsArray()
  type: Array<string>;
  @ApiProperty({
    description: 'Expiry date of credential',
    example: '2027-12-10T18:30:00Z',
  })
  expirationDate: Date;
  @ApiProperty({
    description: 'Credential issuance date',
    example: '2027-12-10T18:30:00Z',
  })
  issuanceDate: Date;

  @ApiProperty({
    description: 'issuer did',
    example: 'did:hid:testnet:..........',
  })
  @IsString()
  @IsDid()
  issuer: string;

  @ApiProperty({
    name: 'credentialSubject',
    description: 'Field value based on schema',
    type: CredentialSubject,
  })
  @Type(() => CredentialSubject)
  @ValidateNested({ each: true })
  credentialSubject: CredentialSubject;

  @ApiProperty({
    name: 'credentialSchema',
    description: 'Schema detail based on which credential has issued',
    type: CredentialSchema,
  })
  @Type(() => CredentialSchema)
  @ValidateNested({ each: true })
  credentialSchema: CredentialSchema;

  @ApiProperty({
    name: 'credentialStatus',
    description: 'Information of credential status',
    type: CredentialStatus,
  })
  @Type(() => CredentialStatus)
  @ValidateNested()
  credentialStatus: CredentialStatus;

  @ApiProperty({
    name: 'proof',
    description: 'Proof of credential',
    type: CredentialProof,
  })
  @Type(() => CredentialProof)
  @ValidateNested({ each: true })
  proof: CredentialProof;
}
export class CreateCredentialResponse {
  @ApiProperty({
    name: 'credentialDocument',
    description: 'Credential doc',
    type: CredDoc,
  })
  @ValidateNested({ each: true })
  @Type(() => CredDoc)
  credentialDocument: CredDoc;

  @ApiProperty({
    name: 'credentialStatus',
    description: 'Status detail of credential',
    type: CredStatus,
  })
  credentialStatus: CredStatus;
  @ApiProperty({
    name: 'persist',
    description: 'Define whether to store cred or ust store its meta',
    example: true,
  })
  persist: boolean;
}

class CredProof extends CredentialProof {
  @ApiProperty({
    name: 'updated',
    description: 'Date on which credential has issued',
    example: '2023-01-25T17:01:02Z',
  })
  @IsString()
  updated: Date;
}
export class ResolveCredential extends CredStatus {
  @ApiProperty({
    name: 'proof',
    description: 'proof of credential',
    type: CredProof,
  })
  @Type(() => CredProof)
  @ValidateNested({ each: true })
  proof: CredProof;
}
