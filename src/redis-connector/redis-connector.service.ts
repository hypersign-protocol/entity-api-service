import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisConnectorService {
  private redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      port: this.configService.get('REDIS_PORT') || 6379,
      host: this.configService.get('REDIS_HOST') || 'localhost',
    });
    Logger.log('Redis Connected', 'RedisConnecter');
  }

  sendVcTxn(txn, vcId) {
    this.redis.rpush(
      'vc-txn',
      JSON.stringify({
        txn: txn,
        vcId: vcId,
      }),
    );
  }
  sendDidTxn(txn, did) {
    this.redis.rpush(
      'vc-txn',
      JSON.stringify({
        txn: txn,
        did: did,
      }),
    );
  }
  async vcStatus(vcId) {
    let result = await this.redis.call(
      'ft.search',
      'idx:vc-txn-err',
      vcId.split(':')[3],
    );

    const key = result[1];
    result = result[0];

    const error = await this.redis.hget(key, 'error');
    return { result, error };
  }
}
