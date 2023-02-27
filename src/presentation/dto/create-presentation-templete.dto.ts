import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import {
  CredentialSchema,
  CredentialSubject,
} from 'src/credential/dto/create-credential.dto';
import { ToSnakeCase } from 'src/utils/customDecorator/case.decorator';
import { IsDid } from 'src/utils/customDecorator/did.decorator';
import { queryType } from '../schemas/presentation-template.schema';
export class TrustedIssuer {
  @ApiProperty({
    name: 'required',
    description: 'defining property is required or not',
    example: true,
  })
  @IsBoolean()
  required: boolean;

  @ApiProperty({
    name: 'issuer',
    description: 'did of the issuer',
    example: 'did:hid:testnet:................',
  })
  @IsDid()
  issuer: string;
}

export class QueryExample {
  @ApiProperty({
    name: 'context',
    description: 'Context',
    example: ['https://www.w3.org/2018/credentials/v1'],
  })
  @IsArray()
  '@context': Array<string>;

  @ApiProperty({
    name: 'type',
    description: 'Type of schema used',
    example: 'AlumniCredential',
  })
  @IsString()
  type: string;

  @ApiProperty({
    name: 'credentialSubject',
    description: 'Credential subject',
    example: {
      name: 'Random name',
      id: 'did:hid:testnet:.............................',
    },
  })
  @ValidateNested()
  @Type(() => CredentialSubject)
  credentialSubject: CredentialSubject;

  @ApiProperty({
    name: 'credentialSchema',
    description: 'Schema detail based on which credential has issued',
    example: {
      id: 'sch:hid:testnet:...............',
      type: 'JsonSchemaValidator2018',
    },
  })
  @ValidateNested({ each: true })
  @Type(() => CredentialSchema)
  credentialSchema: CredentialSchema;
  @ApiProperty({
    name: 'trustedIssuer',
    description: 'Specify credentials from a particular issuer only',
    example: {
      required: true,
      issuer: 'did:hid:testnet:................',
    },
    type: [TrustedIssuer],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrustedIssuer)
  trustedIssuer: Array<TrustedIssuer>;
}

export class CredentialQuery {
  @ApiProperty({
    name: 'required',
    description: 'False by default',
    example: true,
  })
  @IsBoolean()
  required: boolean;
  @ApiProperty({
    name: 'reason',
    description: 'Reason for requesting this credential ',
    example: 'We need you to prove your eligibility to work.',
  })
  @IsString()
  reason: string;
  @ApiProperty({
    name: 'example',
    description:
      'sample detail of credential for which presentation template is to be created',
    example: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: 'AlumniCredential',
      credentialSubject: {
        name: 'Random name',
        id: 'did:hid:testnet:.............................',
      },
      credentialSchema: {
        id: 'sch:hid:testnet:...............',
        type: 'JsonSchemaValidator2018',
      },
      trustedIssuer: [
        {
          required: true,
          issuer: 'did:hid:testnet:................',
        },
      ],
    },
  })
  @ValidateNested()
  @Type(() => QueryExample)
  example: QueryExample;
}
export class Query {
  @ApiProperty({
    name: 'type',
    description: 'Query Type',
    example: 'QueryByExample / DIDAuthentication',
  })
  @IsString()
  @IsEnum(queryType)
  type: queryType;

  @ApiProperty({
    name: 'credentialQuery',
    description: 'credentialQuery',
    example: [
      {
        required: true,
        reason: 'We need you to prove your eligibility to work.',
        example: {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          type: 'AlumniCredential',
          credentialSubject: {
            name: 'Random name',
            id: 'did:hid:testnet:.............................',
          },
          credentialSchema: {
            id: 'sch:hid:testnet:...............',
            type: 'JsonSchemaValidator2018',
          },
          trustedIssuer: [
            {
              required: true,
              issuer: 'did:hid:testnet:................',
            },
          ],
        },
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CredentialQuery)
  credentialQuery: Array<CredentialQuery>;
}
export class CreatePresentationTemplateDto {
  @ApiProperty({
    name: 'domain',
    description: 'Domain name',
    example: 'fyre.hypersign.id',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  domain: string;

  @ApiProperty({
    name: 'name',
    description: 'name of the presentation template',
    example: 'alumni_credential_request (sanke_case)',
  })
  @IsString()
  @IsNotEmpty()
  @ToSnakeCase()
  name: string;
  @ApiProperty({
    name: 'query',
    description: 'query parameter for requesting presentation',
    type: Query,
    isArray: true,
  })
  @IsArray()
  @ValidateNested()
  @Type(() => Query)
  query: Array<Query>;
}
