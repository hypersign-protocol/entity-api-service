import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Trim } from '../../utils/customDecorator/trim.decorator';
import { Type } from 'class-transformer';
import { ValidateVerificationMethodId } from 'src/utils/customDecorator/vmId.decorator';
import { ToPascalCase } from 'src/utils/customDecorator/case.decorator';
import { IsDid } from 'src/utils/customDecorator/did.decorator';

export enum DataType {
  string = 'string',
  number = 'number',
  integer = 'integer',
  boolean = 'boolean',
  date = 'date',
}

export class Fields {
  @ApiProperty({
    name: 'name',
    description: 'Name of the field',
    example: 'name',
  })
  @IsString()
  @Trim()
  name: string;
  @ApiProperty({
    name: 'format',
    description: 'format',
    example: '',
  })
  @IsString()
  @IsOptional()
  format?: string;

  @ApiProperty({
    name: 'type',
    description: 'type of properties',
    example: 'string',
  })
  @Trim()
  @IsEnum(DataType)
  type: DataType;
  @ApiProperty({
    name: 'isRequired',
    description: 'State wheter field is required',
    example: false,
  })
  @IsBoolean()
  isRequired: boolean;
}
export class SchemaBody {
  @ApiProperty({
    description: 'Name of the schema',
    example: 'Railway ticket schemas',
  })
  @IsString()
  @ToPascalCase()
  name: string;

  @ApiProperty({
    description: 'Issuer Did',
    example: 'did:hid:namespace:................',
  })
  @IsString()
  @IsNotEmpty()
  @IsDid()
  author: string;

  @IsOptional()
  @ApiProperty({
    description: 'description for the schema',
    example: 'Student schema',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'additionalProperties',
    example: false,
  })
  @IsBoolean()
  additionalProperties: boolean;

  @ApiProperty({
    description: 'Schema configuration',
    example: [{}],
  })
  @ValidateNested({ each: true })
  @Type(() => Array<Fields>)
  fields: Array<Fields>;
}

export class CreateSchemaDto {
  @ApiProperty({
    name: 'schema',
    description: 'Schema body',
    example: {
      name: 'testSchema',
      description: 'This is a test schema generation',
      author: '',
      fields: [
        {
          name: 'name',
          type: 'string',
          isRequired: false,
        },
      ],
      additionalProperties: false,
    },
  })
  @ValidateNested({ each: true })
  @Type(() => SchemaBody)
  schema: SchemaBody;

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
}

export class createSchemaResponse {
  @ApiProperty({
    name: 'schemaId',
    description: 'Schema id',
    example: 'sch:hid:namespce:.....................',
  })
  schemaId: string;
  @ApiProperty({
    name: 'transactionHash',
    description: 'transaction hash for schema',
    example: 'KAGSLKAGDLKJGA..................',
  })
  transactionHash: string;
}
