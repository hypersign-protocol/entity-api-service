import { Document } from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiResponse } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export type SchemaDocument = Schemas & Document;

@Schema()
export class Schemas {
  @Prop()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'SchemaId',
    example: 'sch:hid:namespace:.....................',
  })
  schemaId: string;

  @Prop()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Id  to which particular schema is issued',
    example: 'aa4ded21-437e-4215-8792-601ce9ba3de5',
  })
  appId: string;
  @Prop()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'issuer Did',
    example: 'did:hid:namespace:.....................',
  })
  authorDid: string;
}

const SchemasSchema = SchemaFactory.createForClass(Schemas);
SchemasSchema.index({ appId: 1, schemaId: 1 }, { unique: true });
export { SchemasSchema };
