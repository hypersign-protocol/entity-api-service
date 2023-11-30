import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly config: ConfigService) {
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
