import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class SchemaError {
  @ApiProperty({
    description: 'statusCode',
    example: 400,
  })
  @IsNumber()
  statusCode: number;

  @ApiProperty({
    description: 'message',
    example: ['error message 1', 'error message 2'],
  })
  @IsString()
  message: Array<string>;

  @ApiProperty({
    description: 'error',
    example: 'Bad Request',
  })
  @IsString()
  error: string;
}

export class SchemaNotFoundError {
  @ApiProperty({
    description: 'statusCode',
    example: 404,
  })
  @IsNumber()
  statusCode: number;

  @ApiProperty({
    description: 'message',
    example: ['error message 1', 'error message 2'],
  })
  @IsString()
  message: Array<string>;

  @ApiProperty({
    description: 'error',
    example: 'Not Found',
  })
  @IsString()
  error: string;
}
