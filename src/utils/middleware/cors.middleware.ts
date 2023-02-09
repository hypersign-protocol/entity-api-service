import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

import { NextFunction, Request, Response } from 'express';
import { AppRepository } from 'src/app-auth/repositories/app.repository';
@Injectable()
export class WhitelistMiddleware implements NestMiddleware {
  constructor(private readonly appRepositiory: AppRepository) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const whitelistedOrigins = process.env.WHITELISTED_CORS;
    const origin = req.header('Origin');
    // To Do Remove this line at the time of pushing code to prod
    console.log(origin);
    if (whitelistedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    } else if (req.header('authorization')) {
      const token = req.header('authorization').split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const appInfo = await this.appRepositiory.findOne({
        appId: decoded['appId'],
        userId: decoded['userId'],
      });
      if (!appInfo['whitelistedCors'].includes(origin)) {
        throw new UnauthorizedException(['Origin mismatch']);
      }
    } else {
      throw new UnauthorizedException(['This is a cors enable api']);
    }
    next();
  }
}