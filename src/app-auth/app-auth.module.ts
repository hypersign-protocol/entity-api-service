import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy/jwt.strategy';
@Module({
  imports: [JwtModule.register({})],
  providers: [JwtStrategy],
  controllers: [],

  exports: [AppAuthModule],
})
export class AppAuthModule {}
