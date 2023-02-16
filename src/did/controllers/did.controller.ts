import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  UseFilters,
  Patch,
  UsePipes,
  ValidationPipe,
  NotFoundException,
  Query,
  UseInterceptors,
  Headers,
} from '@nestjs/common';
import { DidService } from '../services/did.service';
import {
  CreateDidDto,
  CreateDidResponse,
  TxnHash,
} from '../dto/create-did.dto';
import { UpdateDidDto, ResolvedDid } from '../dto/update-did.dto';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
  ApiOkResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { DidError, DidNotFoundError } from '../dto/error-did.dto';
import { AllExceptionsFilter } from '../../utils/utils';
import { PaginationDto } from 'src/utils/pagination.dto';
import { Did } from '../schemas/did.schema';
import { DidResponseInterceptor } from '../interceptors/transformResponse.interseptor';
import { GetDidList } from '../dto/fetch-did.dto';
@UseFilters(AllExceptionsFilter)
@ApiTags('Did')
@Controller('did')
@ApiBearerAuth('Authorization')
@UseGuards(AuthGuard('jwt'))
export class DidController {
  constructor(private readonly didService: DidService) {}
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get()
  @ApiOkResponse({
    description: 'DID List',
    type: GetDidList,
    isArray: true,
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'Error in finding resource',
    type: DidNotFoundError,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer <access_token>',
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
  @UseInterceptors(DidResponseInterceptor)
  getDidList(
    @Headers('Authorization') authorization: string,
    @Req() req: any,
    @Query()
    pageOption: PaginationDto,
  ): Promise<Did[]> {
    const appDetail = req.user;
    return this.didService.getDidList(appDetail, pageOption);
  }

  @Get(':did')
  @ApiOkResponse({
    description: 'DID Resolved',
    type: ResolvedDid,
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'did:hid:testnet:....... does not exists on chain',
    type: DidNotFoundError,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer <access_token>',
    required: false,
  })
  resolveDid(
    @Headers('Authorization') authorization: string,
    @Req() req: any,
    @Param('did') did: string,
  ): Promise<ResolvedDid> {
    const appDetail = req.user;
    return this.didService.resolveDid(appDetail, did);
  }

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )
  @Post()
  @ApiCreatedResponse({
    description: 'DID Created',
    type: CreateDidResponse,
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Error occured at the time of creating schema',
    type: DidError,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer <access_token>',
    required: false,
  })
  create(@Body() createDidDto: CreateDidDto, @Req() req: any) {
    const { options } = createDidDto;
    if (options?.keyType === 'EcdsaSecp256k1RecoveryMethod2020') {
      throw new NotFoundException({
        message: [`${options.keyType} is not supported`, `Feature coming soon`],
        error: 'Not Supported',
        status: 404,
      });
    }
    const appDetail = req.user;
    return this.didService.create(createDidDto, appDetail);
  }
  @UsePipes(ValidationPipe)
  @Patch()
  @ApiOkResponse({
    description: 'DID Updated',
    type: TxnHash,
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Invalid didDoc',
    type: DidError,
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'Resource not found',
    type: DidNotFoundError,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer <access_token>',
    required: false,
  })
  updateDid(@Req() req: any, @Body() updateDidDto: UpdateDidDto) {
    const appDetail = req.user;
    return this.didService.updateDid(updateDidDto, appDetail);
  }
}
