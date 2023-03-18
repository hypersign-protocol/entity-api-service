import { ApiProperty } from '@nestjs/swagger';
import { DidDoc } from './update-did.dto';
import {
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ValidateVerificationMethodId } from 'src/utils/customDecorator/vmId.decorator';

export enum IClientSpec {
  'eth-personalSign' = 'eth-personalSign',
  'cosmos-ADR036' = 'cosmos-ADR036',
}

 export class ClientSpec {
  @ApiProperty({
    description: "IClientSpec  'eth-personalSign' or  'cosmos-ADR036'",
    example: 'eth-personalSign',
    name: 'type',
    required: false,
    enum:IClientSpec,
  })
  @IsEnum(IClientSpec)
  type: IClientSpec;
  @ApiProperty({
    description: "bech32Address",
    example: 'hid334XFEAYYAGLKA....',
    name: 'adr036SignerAddress',
    required: false,
    type:String,
  })
  adr036SignerAddress: string;
}

export class SignInfo{
  @ApiProperty({
    description: 'Verification Method id for did registration',
    example: 'did:hid:testnet:........#key-${idx}',
    required: true,
    
  })
  @ValidateVerificationMethodId()
  @IsString()
  @Matches(/^[a-zA-Z0-9\:]*testnet[a-zA-Z0-9\-:#]*$/, {
    message: "Did's namespace should be testnet",
  })
  verification_method_id:string;

  @ApiProperty({
    description: 'Signature for clientSpec',
    example: 'afafljagahgp9agjagknaglkj/kagka=',
    name: 'signature',
    required: true,
  })
  @ValidateIf((o, value) => o.clientSpec !== undefined)
  @IsNotEmpty()
  @IsString()
  signature: string;

  @ApiProperty({
    description: 'ClienSpec ',
    example: {
      type:IClientSpec['cosmos-ADR036'],
      adr036SignerAddress:'bech32address'

    },
    type:ClientSpec,
    name: 'clinetSpec',
    
  })
  @Type(()=>ClientSpec)
  @ValidateNested({each:true})
  clientSpec:ClientSpec 

}
export class RegisterDidDto {
  @ApiProperty({
    description: 'Did doc to be registered',
    type: DidDoc,
    required: true,
  })
  @IsNotEmptyObject()
  @Type(() => DidDoc)
  @ValidateNested({ each: true })
  didDocument: DidDoc;

  @ApiProperty({
    description: 'Verification Method id for did registration',
    example: 'did:hid:testnet:........#key-${idx}',
    required: false,
  })
  // @ValidateVerificationMethodId()
  // @IsString()
  // @Matches(/^[a-zA-Z0-9\:]*testnet[a-zA-Z0-9\-:#]*$/, {
  //   message: "Did's namespace should be testnet",
  // }) // this is to validate if did is generated using empty namespace
  verificationMethodId?: string;

  // @ApiProperty({
  //   description: "IClientSpec  'eth-personalSign' or  'cosmos-ADR036'",
  //   example: 'eth-personalSign',
  //   name: 'clientSpec',
  //   required: false,
  // })
  // @IsOptional()
  // @IsEnum(IClientSpec)
  // clientSpec?: IClientSpec;

  // @ApiProperty({
  //   description: 'Signature for clientSpec',
  //   example: 'afafljagahgp9agjagknaglkj/kagka=',
  //   name: 'signature',
  //   required: false,
  // })
  // @ValidateIf((o, value) => o.clientSpec !== undefined)
  // @IsNotEmpty()
  // @IsString()
  // signature?: string;



  @ApiProperty({
    description: 'Sign Info',
    example: [{
      verification_method_id: 'did:hid:testnet:........#key-${idx}',
      signature: 'signature',
      clientSpec:{
        type:IClientSpec['cosmos-ADR036'],
        adr036SignerAddress:'Bech32address'
      }
    }],
    isArray:true,
    required: false,
    type:SignInfo
  })
  @Type(()=>SignInfo)
  @ValidateNested({each:true})
  signInfos?:Array<SignInfo>;
  // @ApiProperty({
  //   description: 'Checksum address from web3 wallet',
  //   example: 'hid148273582',
  //   name: 'address',
  //   required: false,
  // })
  // @IsOptional()
  // @IsString()
  // address?: string;
}
