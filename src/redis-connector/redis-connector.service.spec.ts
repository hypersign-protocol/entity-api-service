import { Test, TestingModule } from '@nestjs/testing';
import { RedisConnectorService } from './redis-connector.service';

describe('RedisConnectorService', () => {
  let service: RedisConnectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisConnectorService],
    }).compile();

    service = module.get<RedisConnectorService>(RedisConnectorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
