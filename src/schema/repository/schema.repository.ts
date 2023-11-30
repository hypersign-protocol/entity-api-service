import { Schemas, SchemaDocument } from '../schemas/schemas.schema';
import { FilterQuery, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SchemaRepository {
  constructor(
    @Inject('SCHEMA_MODEL')
    private readonly schemaModel: Model<SchemaDocument>,
  ) {}

  async findOne(schemaFilterQuery: FilterQuery<Schemas>): Promise<Schemas> {
    Logger.log(
      'findOne() method: starts, finding particular schema from db',
      'SchemaRepository',
    );
    return this.schemaModel.findOne(schemaFilterQuery);
  }
  async find(schemaFilterQuery: FilterQuery<Schemas>): Promise<Schemas[]> {
    Logger.log(
      'find() method: starts, finding list of schemas from db',
      'SchemaRepository',
    );
    return await this.schemaModel.aggregate([
      { $match: { appId: schemaFilterQuery.appId } },
      {
        $facet: {
          totalCount: [{ $count: 'total' }],
          data: [
            { $skip: schemaFilterQuery.paginationOption.skip },
            { $limit: schemaFilterQuery.paginationOption.limit },
            {
              $project: { schemaId: 1, _id: 0 },
            },
          ],
        },
      },
    ]);
  }

  async create(schema: Schemas): Promise<Schemas> {
    Logger.log(
      'create() method: starts,creating new schemas in db',
      'SchemaRepository',
    );
    const newSchema = new this.schemaModel(schema);
    return newSchema.save();
  }

  async findOneAndUpdate(
    schemaFilterQuery: FilterQuery<Schemas>,
    schema: Partial<Schemas>,
  ): Promise<Schemas> {
    Logger.log(
      'create() method: starts,updating schemas in db',
      'SchemaRepository',
    );
    return this.schemaModel.findOneAndUpdate(schemaFilterQuery, schema, {
      new: true,
    });
  }
}
