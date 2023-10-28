import { Injectable, Logger } from '@nestjs/common';
import { Credential, CredentialModel } from '../schemas/credntial.schema';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';

@Injectable()
export class CredentialRepository {
  constructor(
    @InjectModel(Credential.name, "APP")
    private readonly credentialModel: Model<CredentialModel>,
  ) {}

  async findOne(
    credentialFilterQuery: FilterQuery<Credential>,
  ): Promise<CredentialModel> {
    Logger.log(
      'findOne() method: starts, finding particular credential from db',
      'CredentialRepository',
    );
    return this.credentialModel.findOne(credentialFilterQuery);
  }
  async find(
    credentialFilterQuery: FilterQuery<Credential>,
  ): Promise<Credential[]> {
    Logger.log(
      'find() method: starts, finding list of credentials from db',
      'CredentialRepository',
    );
    return await this.credentialModel.aggregate([
      { $match: { appId: credentialFilterQuery.appId } },
      {
        $facet: {
          totalCount: [{ $count: 'total' }],
          data: [
            { $skip: credentialFilterQuery.paginationOption.skip },
            { $limit: credentialFilterQuery.paginationOption.limit },
            {
              $project: { credentialId: 1, _id: 0 },
            },
          ],
        },
      },
    ]);
  }

  async create(credential: Credential): Promise<CredentialModel> {
    Logger.log(
      'create() method: starts, adding credential to db',
      'CredentialRepository',
    );
    const newCredential = new this.credentialModel(credential);
    return newCredential.save();
  }

  async findOneAndUpdate(
    credentialFilterQuery: FilterQuery<CredentialModel>,
    credential: Partial<CredentialModel>,
  ): Promise<CredentialModel> {
    Logger.log(
      'findOneAndUpdate() method: starts, updating credential to db',
      'CredentialRepository',
    );
    return this.credentialModel.findOneAndUpdate(
      credentialFilterQuery,
      credential,
      { new: true },
    );
  }
}
