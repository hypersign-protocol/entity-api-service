import { Module } from '@nestjs/common';
import { StatusService } from './status.service';
import { StatusController } from './status.controller';
import { databaseProviders } from 'src/mongoose/tenant-mongoose-connections';
import { TxnStatusRepository } from './repository/status.repository';
import { statusProviders } from './providers/status.provider';

@Module({
  imports: [],
  controllers: [StatusController],
  providers: [
    StatusService,
    ...databaseProviders,
    ...statusProviders,
    TxnStatusRepository,
  ],
  exports: [],
})
export class StatusModule {}
