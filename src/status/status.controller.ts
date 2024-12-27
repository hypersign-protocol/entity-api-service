import {
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
  UseFilters,
} from '@nestjs/common';
import { StatusService } from './status.service';

import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PaginationDto } from 'src/utils/pagination.dto';
import { AllExceptionsFilter } from 'src/utils/utils';
@UseFilters(AllExceptionsFilter)
@ApiTags('Status')
@ApiBearerAuth('Authorization')
@Controller('status')
@UseGuards(AuthGuard('jwt'))
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get('ssi/:id')
  @ApiQuery({
    name: 'page',
    description: 'Page value',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Fetch limited list of data',
    required: false,
  })
  @ApiParam({
    name: 'id',
    description: 'Enter didId or vcId or schemaId',
  })
  getStatus(@Param('id') id: string, @Query() pagination: PaginationDto) {
    return this.statusService.findBySsiId(id, pagination);
  }

  @Get('transaction/:transactionHash')
  @ApiQuery({
    name: 'page',
    description: 'Page value',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Fetch limited list of data',
    required: false,
  })
  @ApiParam({
    name: 'transactionHash',
    description: 'Enter transactionHash',
  })
  getStatusByTransactionHash(
    @Param('transactionHash') transactionHash: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.statusService.findByTxnId(transactionHash, pagination);
  }
}
