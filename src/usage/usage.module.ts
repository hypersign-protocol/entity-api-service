import { Module } from '@nestjs/common';
import { UsageController } from './controllers/usage.controller';
import { UsageService } from './services/usage.service';
import { LogModule } from 'src/log/log.module';

@Module({
  imports: [LogModule],
  controllers: [UsageController],
  providers: [UsageService],
})
export class UsageModule {}
