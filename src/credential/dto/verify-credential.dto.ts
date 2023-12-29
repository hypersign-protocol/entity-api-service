import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmptyObject, IsString, ValidateNested } from 'class-validator';
import { CredDoc, CredentialProof } from './create-credential.dto';

export class VerifyCredentialDto {
  @ApiProperty({
    name: 'credentialDocument',
    description: 'credential document',
  })
  @IsNotEmptyObject()
  @ValidateNested({ each: true })
  @Type(() => CredDoc)
  credentialDocument: CredDoc;
}
class StatusResult {
  @ApiProperty({
    name: 'verified',
    description: 'verification result',
    example: true,
  })
  verified: boolean;
}

class CredResultProof extends CredentialProof {
  @ApiProperty({
    name: 'Context',
    description: '',
    example: [
      'https://www.w3.org/2018/credentials/v1',
      'https://raw.githubusercontent.com/hypersign-protocol/hypersign-contexts/main/HypersignCredentialStatus2023.jsonld',
      {
        '@context': {
          '@protected': true,
          '@version': 1.1,
          id: '@id',
          type: '@type',
          RailwayTicketSchema: {
            '@context': {
              '@propagate': true,
              '@protected': true,
              xsd: 'http://www.w3.org/2001/XMLSchema#',
              name: {
                '@id': 'https://hypersign-schema.org/name',
                '@type': 'xsd:string',
              },
            },
            '@id': 'https://hypersign-schema.org',
          },
        },
      },
      'https://w3id.org/security/suites/ed25519-2020/v1',
    ],
  })
  '@context': Array<string>;
}

class Controller {
  @ApiProperty({
    name: '@context',
    description: 'issuer didDoc id',
    example: ['https://www.w3.org/ns/did/v1'],
  })
  '@contexts': string[];
  @ApiProperty({
    name: 'id',
    description: 'issuer didDoc id',
    example: 'did:hid:testnet:zrstybdkfbjg..........',
  })
  id: boolean;
  @ApiProperty({
    name: 'assertionMethod',
    description: '',
    example: ['did:hid:testnet:zrstybdkfbjg..........'],
  })
  assertionMethod: string[];
}
class PurposeResult {
  @ApiProperty({
    name: 'valid',
    description: '',
    example: true,
  })
  valid: boolean;
  @ApiProperty({
    name: 'controller',
    description: '',
    type: Controller,
  })
  controller: Controller;
}
class VerificationMethod {
  @ApiProperty({
    description: 'Verification Method id',
    example: 'did:hid:testnet:................................#key-${id}',
  })
  @IsString()
  id: string;
  @ApiProperty({
    description: 'Verification Method type',
    example: 'Ed25519VerificationKey2020',
  })
  @IsString()
  type: string;
  @ApiProperty({
    description: 'Verification Method controller',
    example: 'did:hid:method:..............',
  })
  @IsString()
  controller: string;
  @ApiProperty({
    description: 'publicKeyMultibase',
    example: 'z28ScfSszr.............j8nCwx4DBF6nAUHu4p',
  })
  @IsString()
  publicKeyMultibase: string;
}

class Result {
  @ApiProperty({
    name: 'proof',
    description: 'proof of credential',
    type: CredResultProof,
  })
  @Type(() => CredResultProof)
  @ValidateNested()
  'proof': CredResultProof;
  @ApiProperty({
    name: 'verified',
    description: 'proof verification result',
    example: true,
  })
  verified: boolean;
  @ApiProperty({
    name: 'verificationMethod',
    description: 'verification method',
    type: VerificationMethod,
  })
  @Type(() => VerificationMethod)
  @ValidateNested()
  verificationMethod: VerificationMethod;

  @ApiProperty({
    name: 'purposeResult',
    description: 'purpose result',
    type: PurposeResult,
  })
  @Type(() => PurposeResult)
  @ValidateNested()
  purposeResult: PurposeResult;
}
export class VerifyCredentialResponse {
  @ApiProperty({
    name: 'verified',
    description: 'result of credential verification',
  })
  verified: boolean;

  @ApiProperty({
    name: 'results',
    description: 'Verification detail of proof ',
    type: Result,
    isArray: true,
  })
  results: Array<Result>;

  @ApiProperty({
    name: 'statusResult',
    description: 'Verification result',
    type: StatusResult,
  })
  @Type(() => StatusResult)
  @ValidateNested()
  statusResult: StatusResult;
}
