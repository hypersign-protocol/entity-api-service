import { PartialType } from '@nestjs/swagger';
import { CreateUsageDto } from './create-usage.dto';

export class UpdateUsageDto extends PartialType(CreateUsageDto) {}
