import { Test, TestingModule } from '@nestjs/testing';
import { AppOauthController } from './app-oauth.controller';

describe('AppOauthController', () => {
  let controller: AppOauthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppOauthController],
      providers: [],
    }).compile();

    controller = module.get<AppOauthController>(AppOauthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
