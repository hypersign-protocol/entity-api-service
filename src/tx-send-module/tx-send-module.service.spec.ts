import { Test, TestingModule } from '@nestjs/testing';
import { TxSendModuleService } from './tx-send-module.service';

describe('TxSendModuleService', () => {
  let service: TxSendModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TxSendModuleService],
    }).compile();

    service = module.get<TxSendModuleService>(TxSendModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
