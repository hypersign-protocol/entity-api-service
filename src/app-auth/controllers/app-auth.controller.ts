import {
  Controller,
  Get,
  ValidationPipe,
  Post,
  UsePipes,
  Body,
  Put,
  Param,
  UseInterceptors,
  HttpCode,
  UseFilters,
  Query,
  UseGuards,
  Req,
  Delete,
} from '@nestjs/common';
import { CreateAppDto } from 'src/app-auth/dtos/create-app.dto';
import {
  GenerateTokenError,
  GenerateTokenResponse,
  RegenrateAppApiSecretResponse,
} from '../dtos/generate-token.dto';
import { AppAuthService } from 'src/app-auth/services/app-auth.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExcludeController,
  ApiHeader,
  ApiNotFoundResponse,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { App, createAppResponse } from '../schemas/app.schema';
import { AppNotFoundException } from 'src/app-auth/exceptions/app-not-found.exception';
import { UpdateAppDto } from '../dtos/update-app.dto';
import { MongooseClassSerializerInterceptor } from '../../utils/utils';
import { AllExceptionsFilter } from '../../utils/utils';
import { AppError, GetAppList } from '../dtos/fetch-app.dto';
import { PaginationDto } from 'src/utils/pagination.dto';
import { AppSecretHeader } from '../decorator/app-sercret.decorator';
import { TransformResponseInterceptor } from '../interceptors/transformResponse.interseptor';
import { JwtGuard } from '../guard/jwt.guard';

@UseFilters(AllExceptionsFilter)
@Controller('app')
@ApiExcludeController()
@ApiBearerAuth('Authorization')
@UseGuards(JwtGuard)
export class AppAuthController {
  constructor(private readonly appAuthService: AppAuthService) {}
  @UseInterceptors(
    MongooseClassSerializerInterceptor(App, {
      excludePrefixes: ['apiKeySecret', 'apiKeyPrefix', '_', '__'],
    }),
  )
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get()
  @ApiResponse({
    status: 200,
    description: 'App List',
    type: GetAppList,
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'App not found',
    type: AppError,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page value',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'limit value',
    required: false,
  })
  @UseInterceptors(TransformResponseInterceptor)
  async getApps(
    @Req() req: any,
    @Query() pageOption: PaginationDto,
  ): Promise<App[]> {
    const userId = req.user.userId;
    const appList: any = await this.appAuthService.getAllApps(
      userId,
      pageOption,
    );
    if (appList.length === 0) {
      throw new AppNotFoundException();
    }
    if (appList) return appList;
  }
  @UseInterceptors(
    MongooseClassSerializerInterceptor(App, {
      excludePrefixes: ['apiKeySecret', 'apiKeyPrefix', '_', '__'],
    }),
  )
  @Get(':appId')
  @ApiResponse({
    status: 200,
    description: 'App details',
    type: App,
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'App not found',
    type: AppError,
  })
  async getAppById(
    @Req() req: any,

    @Param('appId') appId: string,
  ): Promise<App> {
    const userId = req.user.userId;

    const app = await this.appAuthService.getAppById(appId, userId);
    if (app) return app;
    else throw new AppNotFoundException(); // Custom Exception handling
  }

  @Post()
  @UseInterceptors(
    MongooseClassSerializerInterceptor(createAppResponse, {
      excludePrefixes: ['apiKeyPrefix', '_', '__'],
    }),
  )
  @ApiCreatedResponse({
    description: 'App Created',
    type: createAppResponse,
  })
  @ApiBadRequestResponse({
    description: 'App registration failed',
    type: AppError,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  register(
    @Req() req: any,
    @Body() createAppDto: CreateAppDto,
  ): Promise<createAppResponse> {
    const userId = req.user.userId;

    return this.appAuthService.createAnApp(createAppDto, userId);
  }

  @UseInterceptors(
    MongooseClassSerializerInterceptor(App, {
      excludePrefixes: ['apiKeySecret', 'apiKeyPrefix', '_', '__'],
    }),
  )
  @Put(':appId')
  @ApiResponse({
    status: 200,
    description: 'App updated',
    type: App,
  })
  @ApiNotFoundResponse({
    description: 'App not found',
    type: AppError,
  })
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  )
  async update(
    @Req() req: any,
    @Param('appId') appId: string,
    @Body() updateAppDto: UpdateAppDto,
  ): Promise<App> {
    const userId = req.user.userId;

    const app = await this.appAuthService.getAppById(appId, userId);
    if (app) {
      return this.appAuthService.updateAnApp(appId, updateAppDto, userId);
    } else throw new AppNotFoundException();
  }

  @Delete(':appId')
  @ApiResponse({
    status: 200,
    description: 'App deleted',
    type: App,
  })
  @ApiNotFoundResponse({
    description: ' App not found',
    type: AppError,
  })
  @UseInterceptors(
    MongooseClassSerializerInterceptor(App, {
      excludePrefixes: ['apiKeySecret', 'apiKeyPrefix', '_', '__'],
    }),
  )
  async deleteApp(
    @Req() req: any,
    @Param('appId') appId: string,
  ): Promise<App> {
    const userId = req.user.userId;
    const app = await this.appAuthService.deleteApp(appId, userId);
    return app;
  }
  @Post(':appId/secret/new')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'Api Secret  Regenerated',
    type: RegenrateAppApiSecretResponse,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
    type: AppError,
  })
  async reGenerateAppSecretKey(@Req() req: any, @Param('appId') appId: string) {
    const userId = req.user.userId;

    const app = await this.appAuthService.getAppById(appId, userId);
    if (!app) {
      throw new AppNotFoundException();
    }
    return this.appAuthService.reGenerateAppSecretKey(app, userId);
  }
}

@UseFilters(AllExceptionsFilter)
@ApiTags('App')
@Controller('app')
export class AppOAuthController {
  constructor(private readonly appAuthService: AppAuthService) {}

  @ApiHeader({
    name: 'X-Api-Secret-Key',
    description: 'Provide Api Secret  key to get access token',
    required: true,
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Error occured at the time of generating access token',
    type: AppError,
  })
  @Post('oauth')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'AccessToken generated',
    type: GenerateTokenResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: GenerateTokenError,
  })
  @UsePipes(ValidationPipe)
  generateAccessToken(
    @AppSecretHeader() appSecreatKey,
  ): Promise<{ access_token; expiresIn; tokenType }> {
    return this.appAuthService.generateAccessToken(appSecreatKey);
  }
}
