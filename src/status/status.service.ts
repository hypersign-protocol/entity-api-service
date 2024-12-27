import { Injectable } from '@nestjs/common';
import { TxnStatusRepository } from './repository/status.repository';

@Injectable()
export class StatusService {
  constructor(private readonly txnStatusRepository: TxnStatusRepository) {}
  findBySsiId(id: string, option) {
    const skip = (option.page - 1) * option.limit;
    option['skip'] = skip;
    return `This action returns a #${id} status`;
  }

  findByTxnId(id: string, option) {
    const skip = (option.page - 1) * option.limit;
    option['skip'] = skip;
    return `This action returns a #${id} status`;
  }
}
