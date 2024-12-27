import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { RegistrationStatus } from '../schema/status.schema';

@Injectable()
export class TxnStatusRepository {
  constructor(
    @InjectModel('REGISTRATION_STATUS')
    private registatiationStatusModel: Model<RegistrationStatus>,
  ) {}

  async createOrUpdate(registrationStatus: FilterQuery<RegistrationStatus>) {
    return this.registatiationStatusModel.insertMany(registrationStatus);
  }
}
