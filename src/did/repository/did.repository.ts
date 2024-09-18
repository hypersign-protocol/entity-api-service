import {
  Did,
  DidDocument,
  DidDocumentMetaData,
  DidMetaData,
} from '../schemas/did.schema';
import { FilterQuery, Model } from 'mongoose';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DidRepository {
  constructor(
    @Inject('DID_MODEL') private readonly didModel: Model<DidDocument>,
  ) {}

  async findOne(didFilterQuery: FilterQuery<Did>): Promise<Did> {
    Logger.log(
      'findOne() method: starts, finding particular did from db',
      'DidRepository',
    );
    return this.didModel.findOne(didFilterQuery);
  }
  async find(didFilterQuery: FilterQuery<Did>): Promise<Did[]> {
    Logger.log(
      'find() method: starts, fetching list of  did from db',
      'DidRepository',
    );
    return await this.didModel.aggregate([
      { $match: { appId: didFilterQuery.appId } },
      {
        $facet: {
          totalCount: [{ $count: 'total' }],
          data: [
            { $skip: didFilterQuery.option.skip },
            { $limit: didFilterQuery.option.limit },
            {
              $project: { did: 1, _id: 0 },
            },
          ],
        },
      },
    ]);
  }

  async create(did: Did): Promise<Did> {
    Logger.log(
      'create() method: starts, adding new document for did from db',
      'DidRepository',
    );
    const newDid = new this.didModel(did);
    return newDid.save();
  }

  async findOneAndUpdate(
    didFilterQuery: FilterQuery<Did>,
    did: Partial<Did>,
  ): Promise<Did> {
    Logger.log(
      'findOneAndUpdate() method: starts, update did to db',
      'DidRepository',
    );
    return this.didModel.findOneAndUpdate(didFilterQuery, did, { new: true });
  }
}

@Injectable()
export class DidMetaDataRepo {
  constructor(
    @Inject('DID_METADATA_MODEL')
    private readonly didModel: Model<DidDocumentMetaData>,
  ) {}

  async findOne(
    didFilterQuery: FilterQuery<DidMetaData>,
  ): Promise<DidMetaData> {
    Logger.log(
      'findOne() method: starts, find  meta data of particular did',
      'DidMetaDataRepo',
    );
    return this.didModel.findOne(didFilterQuery);
  }
  async find(didFilterQuery: FilterQuery<DidMetaData>): Promise<DidMetaData[]> {
    Logger.log('find() method: starts, find did meta data', 'DidMetaDataRepo');
    return this.didModel.find(didFilterQuery);
  }

  async create(did: DidMetaData): Promise<DidMetaData> {
    Logger.log('create() method: starts.....', 'DidMetaDataRepo');
    const newDid = new this.didModel(did);
    return newDid.save();
  }

  async findAndReplace(
    didFilterQuery: FilterQuery<DidMetaData>,
    did: DidMetaData,
  ): Promise<DidMetaData> {
    Logger.log('findAndReplace() method: starts.....', 'DidMetaDataRepo');
    return this.didModel.findOneAndReplace(didFilterQuery, did, {
      upsert: true,
    });
  }

  async findOneAndUpdate(
    didFilterQuery: FilterQuery<DidMetaData>,
    did: Partial<DidMetaData>,
  ): Promise<Did> {
    Logger.log('findOneAndUpdate() method: starts.....', 'DidMetaDataRepo');
    return this.didModel.findOneAndUpdate(didFilterQuery, did, {
      upsert: true,
    });
  }
}
