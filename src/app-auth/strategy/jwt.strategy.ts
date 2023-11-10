import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AppRepository } from '../repositories/app.repository';
import { AppAuthSecretService } from '../services/app-auth-passord.service';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly appRepository: AppRepository,
    private readonly appAuthSecretService: AppAuthSecretService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET'),
    });
  }
  async validate(payload) {
    type App = {
      appId: string;
      kmsId: string;
      whitelistedCors: Array<string>;
      subdomain: string;
      edvId: string;
    };
    const appDetail: App = {
      appId: payload?.appId,
      kmsId: payload?.kmsId,
      whitelistedCors: payload?.whitelistedCors,
      subdomain: payload?.subdomain,
      edvId: payload?.edvId,
    };
    return appDetail;
  }
}

@Injectable()
export class JwtStrategyApp extends PassportStrategy(Strategy, 'jwtApp') {
  constructor(
    private readonly config: ConfigService,
    private readonly appRepository: AppRepository,
    private readonly appAuthSecretService: AppAuthSecretService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('STUDIO_SERVER_JWT_SECRET'),
    });
  }
  async validate(payload) {
    payload.userId = payload.email;
    return payload;
  }
}
