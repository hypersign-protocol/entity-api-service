import { Module } from '@nestjs/common';
import { logProviders } from './schema/log.provider';
import { LogService } from './services/log.service';
import { LogRepository } from './repository/log.repository';
import { databaseProviders } from 'src/mongoose/tenant-mongoose-connections';

@Module({
  controllers: [],
  providers: [LogService, LogRepository, ...logProviders, ...databaseProviders],
  exports: [LogRepository, LogService],
})
export class LogModule {}
