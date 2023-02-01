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
import { IsEmptyTrim, Trim } from 'src/utils/customDecorator/trim.decorator';
import { ValidateVerificationMethodId } from 'src/utils/customDecorator/vmId.decorator';
import { IsDid } from 'src/utils/customDecorator/did.decorator';
import { IsSchemaId } from 'src/utils/customDecorator/schemaId.deceorator';
import { IsVcId } from 'src/utils/customDecorator/vc.decorator';

export class CreateCredentialDto {
  @ApiProperty({
    name: 'schemaId',
    description: 'schemaId for credential Schema',
  })
  @IsOptional()
  @IsString()
  @IsEmptyTrim()
  schemaId: string;

  @ApiProperty({
    name: 'subjectDid',
    description: 'holder did of the credential',
  })
  @IsString()
  @IsDid()
  subjectDid: string;
  @ApiProperty({
    name: 'issuerDid',
    description: 'issuerDid of the credential',
  })
  @IsString()
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
  @Trim()
  namespace: string;

  @ApiProperty({
    description: 'Verification Method id for did updation',
    example: 'did:hid:testnet:........#key-${idx}',
  })
  @ValidateVerificationMethodId()
  @IsString()
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
  proofPurpose: string;
  @ApiProperty({
    name: 'proofValue',
    description: '',
    example:
      'z5LairjrBYkc5FtPWeDVuLdQUzpMTBULcp3Q5YDnrLh63UuBuY6BpdiQYhTEcKBFW76TEXFHm37aDvcMtCvnYfmvQ',
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
    example: {
      id: 'vc:hid:testnet:...............',
      currentStatus: 'Live',
      statusReason: 'Credential is active',
    },
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
    name: 'issuanceDate',
    description: 'Date on which credential has issued',
    example: '2023-01-25T16:59:21Z',
  })
  @IsString()
  expirationDate: Date;
  @ApiProperty({
    name: 'issuanceDate',
    description: 'Date on which credential will expire',
    example: '2027-12-10T18:30:00Z',
  })
  @IsString()
  credentialHash: Date;
}
export class CredDoc {
  @ApiProperty({
    description: 'Context',
    example: [
      'https://www.w3.org/2018/credentials/v1',
      {
        hs: 'https://api.jagrat.hypersign.id/hypersign-protocol/hidnode/ssi/schema/sch:hid:testnet:z3KX4ZqoizKTaED645aV4aE8dBbnSpmQYe3xfzVBJadPY:1.0:',
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
  issuer: Date;

  @ApiProperty({
    name: 'CredentialSubject',
    description: 'Field value based on schema',
    example: {
      name: 'Random name',
      id: 'did:hid:testnet:.............................',
    },
  })
  @Type(() => CredentialSubject)
  @ValidateNested({ each: true })
  credentialSubject: CredentialSubject;

  @ApiProperty({
    name: 'credentialSchema',
    description: 'Schema detail based on which credential has issued',
    example: {
      id: 'sch:hid:testnet:...........',
      type: 'JsonSchemaValidator2018',
    },
  })
  @Type(() => CredentialSchema)
  @ValidateNested({ each: true })
  credentialSchema: CredentialSchema;

  @ApiProperty({
    name: 'credentialStatus',
    description: 'Information of credential status',
    example: {
      id: 'https://api.jagrat.hypersign.id/hypersign-protocol/hidnode/ssi/credential/vc:hid:testnet:.............',
      type: 'CredentialStatusList2017',
    },
  })
  @Type(() => CredentialStatus)
  @ValidateNested({ each: true })
  credentialStatus: CredentialStatus;

  @ApiProperty({
    name: 'proof',
    description: 'Proof of credential',
    example: {
      type: 'Ed25519Signature2020',
      created: '2023-01-25T17:01:02Z',
      verificationMethod: 'did:hid:testnet:...............#key-${id}',
      proofPurpose: 'assertionMethod',
      proofValue:
        'z5LairjrBYkc5FtPWeDVuLdQUzpMTBULcp3Q5YDnrLh63UuBuY6BpdiQYhTEcKBFW76TEXFHm37aDvcMtCvnYfmvQ',
    },
  })
  @Type(() => CredentialProof)
  @ValidateNested({ each: true })
  proof: CredentialProof;
}
export class CreateCredentialResponse {
  @ApiProperty({
    name: 'credential',
    description: 'Credential doc',
    example: {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        {
          hs: 'https://api.jagrat.hypersign.id/hypersign-protocol/hidnode/ssi/schema/sch:hid:testnet:z3KX4ZqoizKTaED645aV4aE8dBbnSpmQYe3xfzVBJadPY:1.0:',
        },
        {
          name: 'hs:name',
        },
        'https://w3id.org/security/suites/ed25519-2020/v1',
      ],
      id: 'vc:hid:testnet:zE2NevJ8tXJ92fRyCmWXbTJyhzR8GrcqB6FBM24u64LJT',
      type: ['VerifiableCredential', 'nameschema'],
      expirationDate: '2027-12-10T18:30:00Z',
      issuanceDate: '2023-01-26T19:08:59Z',
      issuer: 'did:hid:testnet:zHNL81YLsHxwnCKxK6wyWxoTjt5xi2svw47RdUyPcmCps',
      credentialSubject: {
        name: 'varsha',
        id: 'did:hid:testnet:zHNL81YLsHxwnCKxK6wyWxoTjt5xi2svw47RdUyPcmCps',
      },
      credentialSchema: {
        id: 'sch:hid:testnet:z3KX4ZqoizKTaED645aV4aE8dBbnSpmQYe3xfzVBJadPY:1.0',
        type: 'JsonSchemaValidator2018',
      },
      credentialStatus: {
        id: 'https://api.jagrat.hypersign.id/hypersign-protocol/hidnode/ssi/credential/vc:hid:testnet:zE2NevJ8tXJ92fRyCmWXbTJyhzR8GrcqB6FBM24u64LJT',
        type: 'CredentialStatusList2017',
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: '2023-01-26T19:10:50Z',
        verificationMethod:
          'did:hid:testnet:zHNL81YLsHxwnCKxK6wyWxoTjt5xi2svw47RdUyPcmCps#key-1',
        proofPurpose: 'assertionMethod',
        proofValue:
          'zEmgea5FY4RkS7scGxE73UgYBskAbAY1CaWRWYwBEd1hh42uWGnJStreWY9Deo8co1zHoFXELWfTXJELR2L8UDsy',
      },
    },
  })
  @ValidateNested({ each: true })
  @Type(() => CredDoc)
  credential: CredDoc;

  @ApiProperty({
    name: 'credentialStatus',
    description: 'Status detail of credential',
    example: {
      claim: {
        id: 'vc:hid:testnet:....................',
        currentStatus: 'Live',
        statusReason: 'Credential is active',
      },
      issuer: 'did:hid:testnet:....................',
      issuanceDate: '2023-01-25T16:59:21Z',
      expirationDate: '2027-12-10T18:30:00Z',
      credentialHash:
        'ae93886f2af41144340e57eab576ac35edfee43f6d1c6ae4b644a81393d43730',
    },
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
    example: {
      type: 'Ed25519Signature2020',
      created: '2023-01-25T16:07:46Z',
      updated: '2023-01-25T16:07:46Z',
      verificationMethod: 'did:hid:testnet:.....................#key-1',
      proofPurpose: 'assertion',
      proofValue:
        'ptMxg+b12cE5ephfj4cCpPR5UBaB5EzU1arE5xp/irTzC2WECM+BYeFxPYkmJeInVpoSlgKKTFw9RRnJmtZlAw==',
    },
  })
  @Type(() => CredProof)
  @ValidateNested({ each: true })
  proof: CredProof;
}
