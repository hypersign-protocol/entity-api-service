import { PartialType } from '@nestjs/swagger';
import { CreateSchemaDto } from './create-schema.dto';

export class UpdateSchemaDto extends PartialType(CreateSchemaDto) {}
