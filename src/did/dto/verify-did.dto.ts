import { ApiProperty } from '@nestjs/swagger';
import { BaseDidDto, Proof, SignedDidDocument } from './sign-did.dto';
import {
  IsBoolean,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DidDoc } from './update-did.dto';
import { IKeyType } from 'hs-ssi-sdk';

export class VerifyDidDto extends BaseDidDto {
  @ApiProperty({
    name: 'didDocument',
    description: 'didDocument',
    type: DidDoc,
  })
  @IsOptional()
  @IsNotEmptyObject()
  @Type(() => SignedDidDocument)
  @ValidateNested({ each: true })
  didDocument: SignedDidDocument;
}

export class Controller {
  @ApiProperty({
    name: '@context',
    example: 'https://w3id.org/security/v2',
  })
  '@context': string;
  @ApiProperty({
    name: 'id',
    description: 'Id of the verification method',
    example: 'did:hid:testnet:....................#key-1',
  })
  @IsString()
  id: string;

  @ApiProperty({
    name: 'authentication',
    example: ['did:hid:testnet:....................#key-1'],
    description: 'Present only if purpose is authentication',
    required: false,
  })
  @IsString()
  authentication?: Array<string>;
  @ApiProperty({
    name: 'assertionMethod',
    example: ['did:hid:testnet:....................#key-1'],
    description: 'Present only if purpose is assertionMethod',
    required: false,
  })
  @IsString()
  assertionMethod?: Array<string>;
}

export class PurposeResult {
  @ApiProperty({
    name: 'valid',
    example: true,
  })
  @IsBoolean()
  valid: boolean;

  @ApiProperty({
    name: 'controller',
    type: Controller,
  })
  @ValidateNested({ each: true })
  @Type(() => Controller)
  controller: Controller;
}

export class VerificationMethod {
  @ApiProperty({
    name: 'id',
    description: 'Id of the verification method',
    example: 'did:hid:testnet:....................#key-1',
  })
  @IsString()
  id: string;
  @ApiProperty({
    name: 'type',
    description: 'Verification key type',
    example: IKeyType.Ed25519VerificationKey2020,
  })
  @IsString()
  type: string;

  @ApiProperty({
    name: 'publicKeyMultibase',
    example: 'z6MkvfkK24wE6KxJbw6XadDkmMSZwhmtJx4mYZG6hFci9eNm',
  })
  @IsString()
  publicKeyMultibase: string;
}

class VerificationProof extends Proof {
  @ApiProperty({
    name: '@context',
    example: [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1',
    ],
  })
  '@context': Array<string>;
}
export class Results {
  @ApiProperty({
    name: 'proof',
    description: '',
    type: VerificationProof,
  })
  @ValidateNested({ each: true })
  @Type(() => VerificationProof)
  proof: VerificationProof;
  @ApiProperty({
    name: 'verified',
    description: 'verification result',
    example: true,
  })
  @IsBoolean()
  verified: boolean;
  @ApiProperty({
    name: 'verificationMethod',
    type: VerificationMethod,
  })
  @ValidateNested({ each: true })
  @Type(() => VerificationMethod)
  verificationMethod: VerificationMethod;

  @ApiProperty({
    name: 'purposeResult',
    type: PurposeResult,
  })
  @ValidateNested({ each: true })
  @Type(() => PurposeResult)
  purposeResult: PurposeResult;
}

export class VerifyDidDocResponseDto {
  @ApiProperty({
    name: 'verified',
    description: 'Result of did document verification',
    example: true,
    // isBoolean: true
  })
  @IsBoolean()
  verified: boolean;
  @ApiProperty({
    name: 'results',
    description: 'verification result',
    type: Results,
    isArray: true,
  })
  results: Results;
}
