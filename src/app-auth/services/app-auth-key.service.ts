import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import { ApiKeyRepository } from '../repositories/app-apikey.repository';
import { AppAuthSecretService } from './app-auth-passord.service';


@Injectable()
export class KeyService {

  constructor(private readonly apiKeyRepository: ApiKeyRepository, private readonly appAuthService: AppAuthSecretService) {

  }

  private generateRandomString(length: number): string {
    return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length)
  }
  async generateApiKey(name,permissions: string[], appId,userId, validTill?) {
    const apiKey = this.generateRandomString(29);
    const secret = this.generateRandomString(97)
    const toHash=apiKey+"."+secret
    
    const apiSecret = await this.appAuthService.hashSecrets(toHash)
    validTill = validTill ? new Date(validTill) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await this.apiKeyRepository.create({
      name,
      apiKey: apiKey, permissions, appId, apiSecret,
      userId,
      validTill
    });
    return toHash
  }

}