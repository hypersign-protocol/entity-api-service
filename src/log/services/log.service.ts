import { Injectable, Logger } from '@nestjs/common';
import { LogRepository } from '../repository/log.repository';
import { CreateLogDto } from '../dto/create-log.dto';

@Injectable()
export class LogService {
  constructor(private readonly logRepo: LogRepository) {}
  async createLog(log: any) {
    Logger.log(
      `Storing log to db:  ${log.method} ${log.path} ${log.statusCode} ${log.contentLenght} ${log.userAgent} ${log.appId}`,
      'LogService',
    );

    return this.logRepo.create(log);
  }

  async findLogByAppId(appId: string): Promise<CreateLogDto[]> {
    Logger.log(
      `Finding log by appId : 
    ${appId}
    `,
      'LogService',
    );
    return await this.logRepo.findByAppId(appId);
  }

  async findLogBetweenDates(
    startDate: Date,
    endDate: Date,
    appId: string,
  ): Promise<CreateLogDto[]> {
    Logger.log(
      `Finding log by appId : 
    ${appId}
    `,
      'LogService',
    );

    return await this.logRepo.findLogBetweenDates({
      startDate,
      endDate,
      appId,
    });
  }
}
