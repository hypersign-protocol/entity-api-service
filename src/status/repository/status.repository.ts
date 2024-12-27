import { Inject, Injectable } from '@nestjs/common';
import { FilterQuery, Model, ProjectionType, QueryOptions } from 'mongoose';
import { RegistrationStatusDocument } from '../schema/status.schema';
import { skip } from 'rxjs';

@Injectable()
export class TxnStatusRepository {
  constructor(
    @Inject('STATUS_MODEL')
    private readonly registatiationStatusModel: Model<RegistrationStatusDocument>,
  ) {}

  async find(
    registrationStatus: FilterQuery<RegistrationStatusDocument>,
    projection?: ProjectionType<RegistrationStatusDocument>,
    option?: QueryOptions<RegistrationStatusDocument>,
  ) {
    return this.registatiationStatusModel.find(
      registrationStatus,
      projection,
      option,
    );
  }
}
