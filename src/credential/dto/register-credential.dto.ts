import { ApiProperty } from '@nestjs/swagger';
import { CredStatus, Namespace } from './create-credential.dto';
import { Type } from 'class-transformer';
import { IsEnum, ValidateNested } from 'class-validator';

export class RegisterCredentialStatusDto {
  @ApiProperty({
    name: 'credentialStatus',
    description: 'Credential status',
    required: true,
    type: CredStatus,
  })
  @Type(() => CredStatus)
  @ValidateNested({ each: true })
  credentialStatus: CredStatus;
  @ApiProperty({
    name: 'namespace',
    description: 'Namespace',
    example: 'testnet',
  })
  @IsEnum(Namespace, {
    message: "namespace must be one of the following values: 'testnet', '' ",
  })
  namespace: string;
}
