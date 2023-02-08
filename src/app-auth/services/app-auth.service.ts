import {
  UnauthorizedException,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { CreateAppDto } from '../dtos/create-app.dto';

import { App, createAppResponse } from 'src/app-auth/schemas/app.schema';
import { AppRepository } from '../repositories/app.repository';
import { uuid } from 'uuidv4';
import { UpdateAppDto } from '../dtos/update-app.dto';
import { HidWalletService } from '../../hid-wallet/services/hid-wallet.service';
import { EdvService } from '../../edv/services/edv.service';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { EdvDocsDto } from 'src/edv/dtos/create-edv.dto';
import { AppAuthSecretService } from './app-auth-passord.service';
import { GenerateTokenDto } from '../dtos/generate-token.dto';
import { JwtService } from '@nestjs/jwt';
import { KeyService } from './app-auth-key.service';
import { ApiKeyRepository } from '../repositories/app-apikey.repository';
import { ApiSecret, createApiKeyResp } from '../schemas/app-apikey.schema';
import { Transform } from 'class-transformer';
import { Role } from 'src/utils/Enum/roles.enum';
import { ApiSecretDto } from '../dtos/api-secret.dto';

@Injectable()
export class AppAuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly appRepository: AppRepository,
    private readonly hidWalletService: HidWalletService,
    private readonly edvService: EdvService,
    private readonly appAuthSecretService: AppAuthSecretService,
    private readonly jwt: JwtService,
    private readonly appApiKeyService: KeyService,
    private readonly appApiKeyRepository: ApiKeyRepository
  ) { }

  async createAnApp(
    createAppDto: CreateAppDto,
    userId: string,
  ): Promise<createAppResponse> {
    const { mnemonic, address } = await this.hidWalletService.generateWallet();
    const edvId = 'hs:apiservice:edv:' + uuid();
    await this.edvService.init(edvId);
    const document: EdvDocsDto = {
      mnemonic,
      address,
    };


    const { id: edvDocId } = await this.edvService.createDocument(document);
    const appId = uuid()
    const appData = await this.appRepository.create({
      ...createAppDto,
      userId,
      appId, // generate app id
      edvId, // generate edvId  by called hypersign edv service
      kmsId: 'demo-kms-1',
      edvDocId,
      walletAddress: address,
    })


    return appData
  }

  async getAllApps(userId: string, paginationOption): Promise<App[]> {
    const skip = (paginationOption.page - 1) * paginationOption.limit;
    paginationOption.skip = skip;
    return this.appRepository.find({ userId, paginationOption });
  }

  async getAppById(appId: string, userId: string): Promise<App> {
    return this.appRepository.findOne({ appId, userId });
  }

  updateAnApp(
    appId: string,
    updataAppDto: UpdateAppDto,
    userId: string,
  ): Promise<App> {
    return this.appRepository.findOneAndUpdate({ appId, userId }, updataAppDto);
  }

  async generateAccessToken(
    apiAuthKey: string,
  ): Promise<{ access_token; expiresIn; tokenType }> {
    const apikeyIndex = apiAuthKey.split('.')[0]
    const { appId, permissions, userId, apiSecret } = await this.appApiKeyRepository.findOne({ apiKey: apikeyIndex })
    const valid = await this.appAuthSecretService.comapareSecret(apiAuthKey, apiSecret)
    if (!valid) {
      throw new UnauthorizedException(['Invalid api key', 'access_denied']);
    }

    const payload = {
      appId,
      userId,
      permissions,
    };
    const appDetail = await this.appRepository.findOne({
      appId,
    });

    if (!appDetail) {
      throw new UnauthorizedException(['access_denied']);
    }
    if (userId !== appDetail.userId) {
      throw new UnauthorizedException(['access_denied']);
    }
    const secret = this.config.get('JWT_SECRET');
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '4h',
      secret,
    });
    const expiresIn = (4 * 1 * 60 * 60 * 1000) / 1000;
    return { access_token: token, expiresIn, tokenType: 'Bearer' };
  }








  async createApiSecreat(app, apiSecret: ApiSecretDto) {

    const {permissions} = apiSecret
    const {expiry}=apiSecret
    const {name}=apiSecret
    const apiKey = await this.appApiKeyService.generateApiKey(
      name,
      permissions,
      app.appId,
      app.userId,
      expiry
     
    )
    
    return {
      apiKey
    }
    


  }


  async getApiKeys(appId,userId){    
    const apiKeys=await this.appApiKeyRepository.findAll({appId:appId,userId:userId})
    return apiKeys
  }


async deleteApiKeys(appId,userId,apiKey){
  console.log(appId,userId,apiKey);
  

}


}
