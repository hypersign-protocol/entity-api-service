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
} from '@nestjs/swagger';
import { Schemas } from '../schemas/schemas.schema';
import { SchemaResponseInterceptor } from '../interceptors/transformResponse.interseptor';
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
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Body() createSchemaDto: CreateSchemaDto, @Req() req: any) {
    const appDetail = req.user;
    return this.schemaService.create(createSchemaDto, appDetail);
  }
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get()
  @ApiResponse({
    status: 200,
    description: 'Schema List',
    type: String,
    isArray: true,
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'No schema has created',
    type: SchemaNotFoundError,
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
    @Req() req: any,
    @Query() paginationOption: PaginationDto,
  ): Promise<Schemas[]> {
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
    description: 'schema with id sch:hid:testnet:...... not found',
    type: SchemaNotFoundError,
  })
  resolveSchema(
    @Param('schemaId') schemaId: string,
    @Req() req: any,
  ): Promise<ResolveSchema> {
    const appDetail = req.user;
    return this.schemaService.resolveSchema(schemaId, appDetail);
  }
}
