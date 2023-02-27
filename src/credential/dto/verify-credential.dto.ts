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
}
class PurposeResult {
  @ApiProperty({
    name: 'valid',
    description: '',
    example: true,
  })
  valid: boolean;
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
