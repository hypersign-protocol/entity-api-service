import { Document } from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
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

  @Prop({ required: false })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'transactionHash of the schema',
    example: 'LFJWEKGSKDGFKSHGDUFK...................',
  })
  transactionHash: string;
}

const SchemasSchema = SchemaFactory.createForClass(Schemas);
SchemasSchema.index({ appId: 1, schemaId: 1, authorDid: 1 }, { unique: true });
SchemasSchema.index({ schemaId: 1 }, { unique: true });

export { SchemasSchema };
function Ref(): (target: Schemas, propertyKey: 'authorDid') => void {
  throw new Error('Function not implemented.');
}
