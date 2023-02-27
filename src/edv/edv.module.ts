import { Module } from '@nestjs/common';
import { EdvService } from './services/edv.service';

@Module({
  providers: [EdvService],
})
export class EdvModule {}
