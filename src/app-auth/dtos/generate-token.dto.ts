import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
// export class GenerateTokenDto {
//   @ApiProperty({
//     description: 'appId',
//     example: '03b27d82-8d6d-4ce2-927a-498726e20928',
//   })
//   @IsNotEmpty()
//   @IsString()
//   @Trim()
//   appId: string;
//   @ApiProperty({
//     description: 'apiKeySecret',
//     example: 'f143a15f-892d-4982-8fcf-2f8b09cfb633',
//   })
//   @IsNotEmpty()
//   @IsString()
//   @Trim()
//   apiKeySecret: string;

//   @ApiProperty({
//     description: 'grantType',
//     example: 'client_credentials',
//   })
//   @IsNotEmpty()
//   @IsString()
//   grantType: string;
// }

export class GenerateTokenError {
  @ApiProperty({
    description: 'statusCode',
    example: 401,
  })
  @IsNumber()
  statusCode: number;

  @ApiProperty({
    description: 'message',
    example: ['access_denied'],
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Unauthorized',
    example: 'Unauthorized',
  })
  @IsString()
  error: 'Unauthorized';
}
export class GenerateTokenResponse {
  @ApiProperty({
    description: 'accessToken',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6IjRkNjhmMjNmLTcwZjQtNDFhZC1hMGViLTU3MjA4YTZlOTcxMSIsImFwcFNlY3JldCI6IjNjN2NiNTY1LTZmNWQtNGY2MC1hMjQ2LTZhOGFjYWVhMmY0MyIsImdyYW50VHlwZSI6ImNsaWVudF9jcmVkZW50aWFscyIsImlhdCI6MTY3NDAyMDY3NCwiZXhwIjoxNjc0MDM1MDc0fQ.P-AbheTJMxQNGLTkGWOsnct4M0nKCd-7oUFGqMCpIDM',
  })
  @IsNotEmpty()
  @IsString()
  access_token: string;

  @ApiProperty({
    description: 'Type of token',
    example: 'Bearer',
  })
  @IsNotEmpty()
  @IsString()
  tokenType: string;

  @ApiProperty({
    description: 'Token expiry time',
    example: 14400,
  })
  @IsNotEmpty()
  @IsNumber()
  expiresIn: number;
}

export class RegenrateAppApiSecretResponse {
  @ApiProperty({
    description: 'apiSecretKey for getting access token',
    example: 'xyz.ert34nbhjf48959',
  })
  apiSecretKey: string;
}
