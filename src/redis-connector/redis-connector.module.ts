import { Module } from '@nestjs/common';
import { RedisConnectorService } from './redis-connector.service';

@Module({
  controllers: [],
  providers: [RedisConnectorService],
  exports: [RedisConnectorService],
})
export class RedisConnectorModule {}
