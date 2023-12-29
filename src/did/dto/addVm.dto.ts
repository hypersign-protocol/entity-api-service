import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DidDoc, verificationMethod } from './update-did.dto';
import { Type } from 'class-transformer';
import { IKeyType } from 'hs-ssi-sdk';
import { ValidateVerificationMethodId } from 'src/utils/customDecorator/vmId.decorator';
import { IsDid } from 'src/utils/customDecorator/did.decorator';

export class AddVerificationMethodDto {
  @ApiProperty({
    name: 'did',
    description: 'Id of registered did document',
    example: 'did:hid:testnet:efjr..........',
    required: false,
  })
  @IsOptional()
  @IsString()
  did?: string;
  @ApiProperty({
    name: 'didDocument',
    description: 'Did document',
    type: DidDoc,
    required: false,
  })
  @IsOptional()
  @Type(() => DidDoc)
  @ValidateNested({
    each: true,
  })
  didDocument: DidDoc;
  @ApiProperty({
    name: 'type',
    description: 'key type',
    example: 'Ed25519VerificationKey2020',
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(IKeyType)
  type: IKeyType;
  @ApiProperty({
    name: 'id',
    description: 'VerificationMethod Id',
    example: 'did:hid:testnet:ffg..........#key-${id}',
  })
  @IsOptional()
  @ValidateVerificationMethodId()
  id?: string;
  @ApiProperty({
    name: 'controller',
    description: 'controller of the did document',
    example: 'did:hid:testnet:ffg..........',
  })
  @IsOptional()
  @IsDid()
  controller?: string;
  @ApiProperty({
    description: 'publicKeyMultibase',
    example: 'z28ScfSszr2zi2Bd7qmNE4mfHX5j8nCwx4DBF6nAUHu4p',
    required: false,
  })
  @IsOptional()
  @IsString()
  publicKeyMultibase?: string;
  @ApiProperty({
    description: 'blockchainAccountId',
    example: 'eip155:1:0x19d73aeeBcc6FEf2d0342375090401301Fe9663F',
    required: false,
  })
  @IsOptional()
  @IsString()
  blockchainAccountId?: string;
}

export class AddVMResponse extends DidDoc {
  @ApiProperty({
    description: 'verificationMethod',
    isArray: true,
    example: [
      {
        id: 'did:hid:testnet:...............#key-1',
        type: 'Ed25519VerificationKey2020',
        controller: 'did:hid:method:..............',
        publicKeyMultibase: 'z28ScfSszr2zi2Bd7qmNE4mfHX5j8nCwx4DBF6nAUHu4p',
        blockchainAccountId: '',
      },
      {
        id: 'did:hid:testnet:xyz.............#key-1',
        type: 'Ed25519VerificationKey2020',
        controller: 'did:hid:method:..............',
        publicKeyMultibase: 'zBpyG2BAx7ngwhxMdFjaAnjup6DPztJpjjdfjdgji5GX6zP8E',
        blockchainAccountId: '',
      },
    ],
  })
  @Type(() => verificationMethod)
  verificationMethod: Array<verificationMethod>;
  @ApiProperty({
    description: 'authentication',
    example: [
      'did:hid:method:......#key-${id}',
      'did:hid:method:xyz............#key-${id}',
    ],
  })
  @IsArray()
  authentication: Array<string>;
  @ApiProperty({
    description: 'assertionMethod',
    example: [
      'did:hid:method:......#key-${id}',
      'did:hid:method:xyz............#key-${id}',
    ],
  })
  @IsArray()
  assertionMethod: Array<string>;
  @ApiProperty({
    description: 'capabilityInvocation',
    example: [
      'did:hid:method:......#key-${id}',
      'did:hid:method:xyz............#key-${id}',
    ],
  })
  @IsArray()
  @IsOptional()
  capabilityInvocation: Array<string>;
  @ApiProperty({
    description: 'capabilityDelegation',
    example: [
      'did:hid:method:......#key-${id}',
      'did:hid:method:xyz............#key-${id}',
    ],
  })
  @IsArray()
  @IsOptional()
  capabilityDelegation: Array<string>;
}
