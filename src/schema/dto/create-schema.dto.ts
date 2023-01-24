import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Trim } from '../../utils/customDecorator/trim.decorator';
export class CreateSchemaDto {
  @ApiProperty({
    description: 'Name of the schema',
    example: 'Railway ticket schemas',
  })
  @IsString()
  @Trim()
  name: string;

  @ApiProperty({
    description: 'Issuer Did',
    example: 'did:hid:namespace:................',
  })
  @IsString()
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
    example: [],
  })
  @IsArray()
  fields: object;
}
