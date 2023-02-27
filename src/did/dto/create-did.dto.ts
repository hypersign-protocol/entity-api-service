import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { RegistrationStatus } from '../schemas/did.schema';
import { DidDoc } from '../dto/update-did.dto';
import { IsDid } from 'src/utils/customDecorator/did.decorator';

export enum IKeyType {
  Ed25519VerificationKey2020 = 'Ed25519VerificationKey2020',
  EcdsaSecp256k1VerificationKey2019 = 'EcdsaSecp256k1VerificationKey2019',
  EcdsaSecp256k1RecoveryMethod2020 = 'EcdsaSecp256k1RecoveryMethod2020',
}
export enum VerificationRelationships {
  authentication = 'authentication',
  assertionMethod = 'assertionMethod',
  keyAgreement = 'keyAgreement',
  capabilityInvocation = 'capabilityInvocation',
  capabilityDelegation = 'capabilityDelegation',
}
export enum Namespace {
  testnet = 'testnet',
  mainnet = '',
}
export class Options {
  @ApiProperty({
    description:
      'Verification Method Keytype Ed25519VerificationKey2020 or EcdsaSecp256k1RecoveryMethod2020',
    example: 'keyType:EcdsaSecp256k1RecoveryMethod2020',
    name: 'keyType',
    required: false,
  })
  @ValidateIf((o) => o.keyType !== undefined)
  @IsEnum(IKeyType)
  keyType: IKeyType;

  @ApiProperty({
    name: 'chainId',
    example: '0x1',
    description: 'Chain Id',
    required: false,
  })
  @IsOptional()
  @IsString()
  chainId?: string;

  @ApiProperty({
    name: 'publicKey',
    example: `z76tzt4XCb6FNqC3CPZvsxRfEDX5HHQc2VPux4DeZYndW`,
    description: 'Public Key extracted from keplr',
    required: false,
  })
  @IsOptional()
  @Type(() => Uint8Array || String)
  publicKey?: Uint8Array | string;

  @ApiProperty({
    name: 'walletAddress',
    example: `0x01978e553Df0C54A63e2E063DFFe71c688d91C76`,
    description: 'Checksum address from web3 wallet',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(32)
  walletAddress?: string;
  @IsOptional()
  @IsBoolean()
  register?: boolean = false; // keeping it for time being will remove it later
  @ApiProperty({
    description:
      'verificationRelationships defines  verification methods to be used for which purposes',
    example: 'authentication/ assertionMethod',
    name: 'verificationRelationships',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(VerificationRelationships, { each: true })
  verificationRelationships?: VerificationRelationships[];
}
export class CreateDidDto {
  @ApiProperty({
    name: 'namespace',
    description: 'Namespace to be added in did.',
    example: 'testnet',
  })
  @IsEnum(Namespace, {
    message: "namespace must be one of the following values: 'testnet', '' ",
  })
  namespace: string;
  @IsOptional()
  @IsString()
  @MinLength(32)
  @ApiProperty({
    name: 'methodSpecificId',
    description: 'MethodSpecificId to be added in did',
    example: '0x19d73aeeBcc6FEf2d0342375090401301Fe9663F',
    required: false,
  })
  methodSpecificId?: string;

  @ApiProperty({
    name: 'options',
    description: ' keyType used for verification',
    required: false,
    example: {
      keyType: 'Ed25519VerificationKey2020',
      chainId: '0x1',
      publicKey: 'z76tzt4XCb6FNqC3CPZvsxRfEDX5HHQc2VPux4DeZYndW',
      walletAddress: '0x01978e553Df0C54A63e2E063DFFe71c688d91C76',
      verificationRelationships: ['assertionMethod', 'authentication'],
    },
  })
  @IsOptional()
  @IsObject()
  @Type(() => Options)
  @ValidateNested({
    each: true,
  })
  options?: Options;
}

export class TxnHash {
  @ApiProperty({
    name: 'transactionHash',
    description: 'Transaction Has',
    example: 'XYAIFLKFLKHSLFHKLAOHFOAIHG..........',
  })
  transactionHash: string;
}
class MetaData {
  @ApiProperty({
    description: 'Did document',
    name: 'didDocument',
    type: DidDoc,
  })
  @ValidateNested()
  @Type(() => DidDoc)
  didDocument: DidDoc;
}
export class CreateDidResponse {
  @ApiProperty({
    name: 'did',
    description: 'Did document id',
    example: 'did:hid:namespace:.......................',
  })
  @IsString()
  @IsDid()
  did: string;

  @ApiProperty({
    name: 'registrationStatus',
    description: 'Did document registration status',
    example: 'COMPLETED/PROCESSING',
  })
  registrationStatus: RegistrationStatus;
  @ApiHideProperty()
  @Exclude()
  @IsString()
  transactionHash: string;
  @ApiProperty({
    name: 'metaData',
    description: 'metaData contaning initial didDocument',
    type: MetaData,
  })
  @ValidateNested()
  @Type(() => MetaData)
  metaData: MetaData;
}
export class RegisterDidResponse extends CreateDidResponse {
  @ApiProperty({
    name: 'transactionHash',
    description: 'Transaction Has',
    example: 'XYAIFLKFLKHSLFHKLAOHFOAIHG..........',
  })
  @IsString()
  transactionHash: string;
}
