import { Type } from 'class-transformer';
import { IsNumber, IsObject, IsString, ValidateNested } from 'class-validator';

export class DidsDto {
  @IsObject()
  readonly doc: object;
  @IsNumber()
  readonly index: number;

  @IsString()
  readonly did: string;
}

export class CredsDto {
  @IsObject()
  readonly vc: object;

  @IsString()
  readonly vcId: string;
}

export class EdvDocsDto {
  @IsString()
  readonly mnemonic: string;

  @IsString()
  readonly address: string;

  @ValidateNested()
  @Type(() => Array<DidsDto>)
  readonly dids?: Array<DidsDto>;

  @ValidateNested()
  @Type(() => Array<CredsDto>)
  readonly vcs?: Array<CredsDto>;
}
