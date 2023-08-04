import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseFilters,
  UseGuards,
  Req,
  UsePipes,
  ValidationPipe,
  Query,
  UseInterceptors,
  Headers,
  Logger,
} from '@nestjs/common';
import { PaginationDto } from 'src/utils/pagination.dto';
import { SchemaService } from '../services/schema.service';
import {
  CreateSchemaDto,
  createSchemaResponse,
} from '../dto/create-schema.dto';
import { SchemaError, SchemaNotFoundError } from '../dto/error-schema.dto';
import { ResolveSchema } from '../dto/resolve-schema.dto';
import { AuthGuard } from '@nestjs/passport';
import { AllExceptionsFilter } from 'src/utils/utils';
import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiQuery,
  ApiHeader,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Schemas } from '../schemas/schemas.schema';
import { SchemaResponseInterceptor } from '../interceptors/transformResponse.interseptor';
import { GetSchemaList } from '../dto/get-schema.dto';
import { RegisterSchemaDto } from '../dto/register-schema.dto';
import { TxnHash } from 'src/did/dto/create-did.dto';
@UseFilters(AllExceptionsFilter)
@ApiTags('Schema')
@Controller('schema')
@ApiBearerAuth('Authorization')
@UseGuards(AuthGuard('jwt'))
export class SchemaController {
  constructor(private readonly schemaService: SchemaService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'Schema Created',
    type: createSchemaResponse,
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'Error in finding resource',
    type: SchemaNotFoundError,
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Error occured at the time of creating schema',
    type: SchemaError,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer <access_token>',
    required: false,
  })
  @ApiHeader({
    name: 'Origin',
    description: 'Origin as you set in application cors',
    required: false,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  create(
    @Headers('Authorization') authorization: string,
    @Body() createSchemaDto: CreateSchemaDto,
    @Req() req: any,
  ) {
    Logger.log('SchemaController: create() method: starts');
    const appDetail = req.user;
    return this.schemaService.create(createSchemaDto, appDetail);
  }
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get()
  @ApiResponse({
    status: 200,
    description: 'Schema List',
    type: GetSchemaList,
    isArray: true,
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'No schema has created',
    type: SchemaNotFoundError,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer <access_token>',
    required: false,
  })
  @ApiHeader({
    name: 'Origin',
    description: 'Origin as you set in application cors',
    required: false,
  })
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
  @UseInterceptors(SchemaResponseInterceptor)
  getSchemaList(
    @Headers('Authorization') authorization: string,
    @Req() req: any,
    @Query() paginationOption: PaginationDto,
  ): Promise<Schemas[]> {
    Logger.log('SchemaController: getSchemaList() method: starts');

    const appDetial = req.user;
    return this.schemaService.getSchemaList(appDetial, paginationOption);
  }

  @Get(':schemaId')
  @ApiResponse({
    status: 200,
    description: 'Resolved schema detail',
    type: ResolveSchema,
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'sch:hid:testnet:...... not on chain',
    type: SchemaNotFoundError,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer <access_token>',
    required: false,
  })
  @ApiHeader({
    name: 'Origin',
    description: 'Origin as you set in application cors',
    required: false,
  })
  resolveSchema(
    @Headers('Authorization') authorization: string,
    @Param('schemaId') schemaId: string,
  ): Promise<ResolveSchema> {
    Logger.log('SchemaController: resolveSchema() method: starts');

    return this.schemaService.resolveSchema(schemaId);
  }

  @Post('/register')
  @ApiOkResponse({
    description: 'Registered schema successfully',
    type: TxnHash,
  })
  @ApiBadRequestResponse({
    description: 'Invalid field value',
    type: SchemaError,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer <access_token>',
    required: false,
  })
  @ApiHeader({
    name: 'Origin',
    description: 'Origin as you set in application cors',
    required: false,
  })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  registerSchema(
    @Headers('Authorization') authorization: string,
    @Body() registerSchemaDto: RegisterSchemaDto,
    @Req() req: any,
  ): Promise<{ transactionHash: string }> {
    Logger.log('SchemaController: resolveSchema() method: starts');

    return this.schemaService.registerSchema(registerSchemaDto, req.user);
  }
}
