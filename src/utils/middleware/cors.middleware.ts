import {
  BadRequestException,
  Injectable,
  Logger,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

import { NextFunction, Request, Response } from 'express';
import { AppRepository } from 'src/app-auth/repositories/app.repository';
@Injectable()
export class WhitelistSSICorsMiddleware implements NestMiddleware {
  constructor(private readonly appRepositiory: AppRepository) {}
  async use(req: Request, res: Response, next: NextFunction) {
    Logger.log(
      'WhitelistSSICorsMiddleware: checking if call is form whitelisted domain starts',
      'Middleware',
    );
    const origin = req.header('Origin') || req.header('Referer');

    Logger.debug(
      `WhitelistSSICorsMiddleware: request is comming from ${origin}`,
      'Middleware',
    );

    const subdomain = req.headers['x-subdomain'];
    Logger.debug(`Subdomain ${subdomain} `, 'Middleware');

    if (!subdomain) {
      throw new BadRequestException(['Invalid subdomain']);
    }

    if (
      req.header('authorization') == undefined ||
      req.header('authorization') == ''
    ) {
      Logger.error(
        'WhitelistSSICorsMiddleware: Error authorization token is null or undefiend',
        'Middleware',
      );

      throw new UnauthorizedException([
        'Unauthorized',
        'Please pass access token',
      ]);
    } else if (req.header('authorization')) {
      const token = req.header('authorization').split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      type App = {
        appId?: string;
        kmsId?: string;
        whitelistedCors: Array<string>;
        subdomain: string;
        edvId: string;
      };

      if (
        !decoded ||
        Object.keys(decoded).length < 0 ||
        !decoded['subdomain'] ||
        !decoded['whitelistedCors']
      ) {
        throw new UnauthorizedException(['Invalid authorization token']);
      }

      // TODO: check if by adding swagger UI url in whitelistedcors for that app..
      // const whitelistedOrigins = process.env.WHITELISTED_CORS;
      // let matchOrigin;
      // if (origin) {
      //   // regex to check if url consists of some path or not
      //   const originRegx = /^https?:\/\/[^\/]+/i;
      //   matchOrigin = origin.match(originRegx);
      // }
      // if (matchOrigin && whitelistedOrigins.includes(matchOrigin[0])) {
      //   return next();
      // }

      const appInfo: App = {
        whitelistedCors: decoded['whitelistedCors'],
        subdomain: decoded['subdomain'],
        edvId: decoded['edvId'],
      };
      console.log(appInfo);
      if (appInfo.subdomain != subdomain) {
        throw new UnauthorizedException(['Invalid subdomain']);
      }

      if (!appInfo.whitelistedCors.includes('*')) {
        if (!appInfo['whitelistedCors'].includes(origin)) {
          throw new UnauthorizedException(['Origin mismatch']);
        }
      }
    } else {
      throw new UnauthorizedException(['This is a cors enabled api']);
    }

    req.user = {};
    req.user['subdomain'] = subdomain;
    next();
  }
}
