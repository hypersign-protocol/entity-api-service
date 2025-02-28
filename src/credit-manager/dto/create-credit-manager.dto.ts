import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';
import { Status } from '../schema/credit-manager.schema';
export enum ValidityPeriodUnit {
  DAYS = 'DAYS',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}
export class CreateCreditManagerDto {
  @ApiProperty({
    name: 'credit',
    description: 'Number of credits available',
    example: 1000,
  })
  @IsNumber()
  @Min(10)
  totalCredits: number;
  validityDuration: number;
  validityDurationUnit: ValidityPeriodUnit;
  serviceId: string;
  creditDenom: string;
}

export class createCreditResponse {
  @ApiProperty({
    name: 'totalCredits',
    description: 'Total available credit',
    example: 1000,
  })
  @IsNumber()
  totalCredits: number;
  @ApiProperty({
    name: 'used',
    description: 'Total number of credit used till now',
    example: 0,
  })
  @IsNumber()
  used: number;
  @ApiProperty({
    name: 'validityDuration',
    description:
      'The number of days the credit is valid from the date of activation',
    example: 60,
  })
  @IsNumber()
  validityDuration: number;
  @ApiProperty({
    name: 'status',
    description:
      'The current status of the credit detail. Indicates whether the credit is active or inactive.',
    enum: Status,
    example: Status.INACTIVE,
  })
  @IsString()
  status: string;
  @ApiProperty({
    name: '_id',
    description: 'Unique identifier of credit detail',
    example: '66e0407bc7f8a92162d1e824',
  })
  @IsString()
  _id: string;
  @ApiProperty({
    name: 'createdAt',
    description: 'Time at which document is added',
    example: '2024-09-10T12:50:03.984Z',
  })
  @IsString()
  createdAt: string;
  @ApiProperty({
    name: 'updatedAt',
    description: 'Time at which document last updated',
    example: '2024-09-10T12:50:03.984Z',
  })
  @IsString()
  updatedAt: string;
}

export class ActivateCredtiResponse extends createCreditResponse {
  @ApiProperty({
    name: 'status',
    description:
      'The current status of the credit detail. Indicates whether the credit is active or inactive.',
    enum: Status,
    example: Status.ACTIVE,
  })
  @IsString()
  status: string;
  @ApiProperty({
    name: 'expiresAt',
    description:
      'The date and time when the credit expires. After this timestamp, the credit is no longer valid.',
    example: '2024-11-10T12:50:03.984Z',
  })
  @IsString()
  expiresAt: string;
}
