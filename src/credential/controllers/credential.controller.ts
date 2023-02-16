import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
  UsePipes,
  ValidationPipe,
  Query,
  HttpCode,
  UseInterceptors,
  Headers,
} from '@nestjs/common';
import { CredentialService } from '../services/credential.service';
import {
  CreateCredentialDto,
  CreateCredentialResponse,
  ResolveCredential,
} from '../dto/create-credential.dto';
import { UpdateCredentialDto } from '../dto/update-credential.dto';
import {
  CredentialError,
  CredentialNotFoundError,
} from '../dto/error-credential.dto';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiTags,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PaginationDto } from 'src/utils/pagination.dto';
import {
  VerifyCredentialDto,
  VerifyCredentialResponse,
} from '../dto/verify-credential.dto';
import { BooleanPipe } from 'src/utils/Pipes/boolean.pipe';
import { CredentialResponseInterceptor } from '../interceptors/transformResponse.interseptor';
import { Credential } from '../schemas/credntial.schema';
import { GetCredentialList } from '../dto/fetch-credential.dto';
@ApiBearerAuth('Authorization')
@UseGuards(AuthGuard('jwt'))
@Controller('credential')
@ApiTags('Credential')
export class CredentialController {
  constructor(private readonly credentialService: CredentialService) {}
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get()
  @ApiOkResponse({
    description: 'List of credentials',
    type: GetCredentialList,
    isArray: true,
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'Error in finding resource',
    type: CredentialNotFoundError,
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
  @UseInterceptors(CredentialResponseInterceptor)
  findAll(
    @Headers('Authorization') authorization: string,
    @Req() req: any,
    @Query() pageOption: PaginationDto,
  ): Promise<Credential[]> {
    return this.credentialService.findAll(req.user, pageOption);
  }

  @Get(':credentialId')
  @ApiOkResponse({
    description: 'Resolved credential detail',
    type: ResolveCredential,
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'Credential with id vc:hid:testnet:...... not found',
    type: CredentialNotFoundError,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer <access_token>',
    required: false,
  })
  @ApiQuery({
    name: 'retrieveCredential',
    required: false,
  })
  resolveCredential(
    @Headers('Authorization') authorization: string,
    @Req() req: any,
    @Param('credentialId') credentialId: string,
    @Query('retrieveCredential', BooleanPipe) retrieveCredential: boolean,
  ) {
    const appDetail = req.user;
    retrieveCredential = retrieveCredential === true ? true : false;
    return this.credentialService.resolveCredential(
      credentialId,
      appDetail,
      retrieveCredential,
    );
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Post('/issue')
  @ApiCreatedResponse({
    description: 'Credential Created',
    type: CreateCredentialResponse,
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Error occured at the time of creating credential',
    type: CredentialError,
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'Resource not found',
    type: CredentialNotFoundError,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer <access_token>',
    required: false,
  })
  create(@Body() createCredentialDto: CreateCredentialDto, @Req() req) {
    return this.credentialService.create(createCredentialDto, req.user);
  }

  @UsePipes(ValidationPipe)
  @HttpCode(200)
  @Post('/verify')
  @ApiOkResponse({
    description: 'verification result of credential',
    type: VerifyCredentialResponse,
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Error occured at the time of verifying credential',
    type: CredentialError,
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'Resource not found',
    type: CredentialNotFoundError,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer <access_token>',
    required: false,
  })
  verify(@Body() verifyCredentialDto: VerifyCredentialDto, @Req() req) {
    return this.credentialService.verfiyCredential(
      verifyCredentialDto,
      req.user,
    );
  }

  @UsePipes(ValidationPipe)
  @Patch(':credentialId')
  @ApiOkResponse({
    description: 'Credential Updated',
    type: ResolveCredential,
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'did:hid:testnet:........#key-${idx} not found',
    type: CredentialNotFoundError,
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Error occured at the time of creating credential',
    type: CredentialError,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer <access_token>',
    required: false,
  })
  update(
    @Headers('Authorization') authorization: string,
    @Param('credentialId') credentialId: string,
    @Body() updateCredentialDto: UpdateCredentialDto,
    @Req() req,
  ) {
    return this.credentialService.update(
      credentialId,
      updateCredentialDto,
      req.user,
    );
  }
}
