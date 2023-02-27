import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Validate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsUrlEmpty } from 'src/utils/customDecorator/isUrl.decorator';
import { Transform } from 'class-transformer';
import validator from 'validator';
import { SanitizeUrlValidator } from 'src/utils/sanitizeUrl.validator';

export class UpdateAppDto {
  @ApiProperty({
    description: 'Application Name',
    example: 'demo app',
  })
  @Transform(({ value }) => validator.trim(value))
  @IsString()
  @IsNotEmpty()
  @Length(5, 50)
  appName: string;
  @ApiProperty({
    description: 'Whitelisted cors',
    example: ['https://example.com'],
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @Matches(/^(https?:\/\/[^ ]+|\*)$/, {
    each: true,
    message: 'Whitelisted cors must be a valid url or *',
  })
  @Validate(SanitizeUrlValidator)
  whitelistedCors: Array<string>;
  @ApiProperty({
    description: 'description',
    example: 'Example description',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description: string;
  @ApiProperty({
    description: 'logoUrl',
    example: 'http://image.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrlEmpty()
  logoUrl: string;
}
