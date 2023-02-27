import { Test, TestingModule } from '@nestjs/testing';
import { AppAuthSecretService } from './app-auth-passord.service';

describe('AppAuthPassordService', () => {
  let service: AppAuthSecretService;
  const secret = '6585de34-6783-431c-af64-af0fd4d1a584';
  let hash = null;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppAuthSecretService],
    }).compile();

    service = module.get<AppAuthSecretService>(AppAuthSecretService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Should Return hash string', async () => {
    hash = await service.hashSecrets(secret);
    expect(typeof hash).toEqual('string');
  });

  it('Should Return True', async () => {
    hash = await service.hashSecrets(secret);
    const value = await service.comapareSecret(secret, hash);
    expect(typeof value).toEqual('boolean');
    expect(value).toBe(true);
  });
});
