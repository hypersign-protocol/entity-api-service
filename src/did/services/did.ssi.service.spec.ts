import { Test, TestingModule } from '@nestjs/testing';
import { DidSSIService } from '../services/did.ssi.service';

describe('DidSSIService', () => {
  let service: DidSSIService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DidSSIService],
    }).compile();
    service = module.get<DidSSIService>(DidSSIService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
