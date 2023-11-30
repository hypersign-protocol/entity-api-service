import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import {
  MongooseOptionsFactory,
  MongooseModuleOptions,
} from '@nestjs/mongoose';
import { REQUEST } from '@nestjs/core';
import { Request } from '@nestjs/common';
import { decode } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable({ scope: Scope.REQUEST })
export class MongooseConfigService implements MongooseOptionsFactory {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly config: ConfigService,
  ) {}

  createMongooseOptions(): MongooseModuleOptions {
    try {
      Logger.log('Inside createMongooseOptions ', 'mongooseService');
      const bearerJWT = this.request.headers['authorization'];
      if (!bearerJWT) {
        throw new Error('Request authorization is required');
      }

      const jwt = bearerJWT.split(' ')[1];
      if (!jwt) throw new Error('Invalid jwt');

      const jwtPayload = decode(jwt);

      const appId = jwtPayload['appId'];
      if (!appId) throw new Error('Invalid jwt payload');

      // TODO: take this from env using configService
      const BASE_DB_PATH = this.config.get('BASE_DB_PATH');
      if (!BASE_DB_PATH) {
        throw new Error('No BASE_DB_PATH set in env');
      }
      const uri = `${BASE_DB_PATH}/${appId}?retryWrites=true&w=majority`;
      Logger.log('DB Uri ' + uri, 'mongooseService');

      return {
        uri, // Change this to whatever you want; you have full access to the request object.
      };
    } catch (e) {
      throw new Error(e.message);
    }
  }
}
