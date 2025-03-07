import {
  Controller,
  Get,
  UseFilters,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AllExceptionsFilter } from 'src/utils/utils';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LogService } from 'src/log/services/log.service';
import { AuthGuard } from '@nestjs/passport';
import { FetchUsageRespDetail } from '../dto/create-usage.dto';
@UseFilters(AllExceptionsFilter)
@ApiTags('Utilities')
@ApiBearerAuth('Authorization')
@UseGuards(AuthGuard('jwt'))
@Controller('usage')
export class UsageController {
  constructor(private readonly logService: LogService) {}

  @Get()
  @ApiOkResponse({
    description: 'Usage detail fetched successfully',
    type: FetchUsageRespDetail,
  })
  @ApiBadRequestResponse({
    description: 'Error has occurred at the time sending verification result',
    // type: ResultErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Authorization token is invalid or expired.',
    // type: ResultUnauthorizationErrorResponse,
  })
  @ApiQuery({
    name: 'serviceId',
    description: 'Service Id',
    required: false,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: Date,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: Date,
  })
  async getUsageByDate(
    @Query('serviceId') appIdParam: string,
    @Query('startDate') startDateParam: Date,
    @Query('endDate') endDateParam: Date,
    @Req() req, // : Promise<UsageResponseDto>
  ) {
    let appId;
    if (!appIdParam) {
      appId = req.app.appId;
    } else {
      appId = appIdParam;
    }

    let startDate;
    let endDate;

    const today = new Date();
    if (!startDateParam) {
      const day = 1;
      const month = today.getMonth();
      const year = today.getFullYear();
      startDate = new Date(year, month, day);
    } else {
      startDate = new Date(startDateParam);
    }

    if (!endDateParam) {
      endDate = today;
    } else {
      endDate = new Date(endDateParam);
    }

    const serviceDetails =
      await this.logService.findBetweenDatesAndAgreegateByPath(
        startDate,
        endDate,
        appId,
      );
    const response = {
      serviceId: appId,
      startDate,
      endDate,
      serviceDetails,
    };

    return response;
  }
  @Get('/detail')
  @ApiOkResponse({
    description: 'Detail of api call made',
    // type: FormatedUsageSessionDetailResp,
  })
  @ApiBadRequestResponse({
    description: 'Error has occurred at the time sending verification result',
    // type: ResultErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Authorization token is invalid or expired.',
    // type: ResultUnauthorizationErrorResponse,
  })
  @ApiQuery({
    name: 'serviceId',
    description: 'Service Id',
    required: false,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: Date,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: Date,
  })
  async getUsageDetailByDate(
    @Query('serviceId') appIdParam: string,
    @Query('startDate') startDateParam: Date,
    @Query('endDate') endDateParam: Date,
    @Req() req, // : Promise<UsageResponseDto>
  ) {
    let appId;
    if (!appIdParam) {
      appId = req.app.appId;
    } else {
      appId = appIdParam;
    }

    let startDate;
    let endDate;

    const today = new Date();
    if (!startDateParam) {
      const day = 1;
      const month = today.getMonth();
      const year = today.getFullYear();
      startDate = new Date(year, month, day);
    } else {
      startDate = new Date(startDateParam);
    }

    if (!endDateParam) {
      endDate = today;
    } else {
      endDate = new Date(endDateParam);
    }

    const serviceDetails = await this.logService.findDetailedLogBetweenDates(
      startDate,
      endDate,
      appId,
    );
    const response =
      // : UsageResponseDto =
      {
        serviceId: appId,
        startDate,
        endDate,
        serviceDetails,
      };

    return response;
  }
}
