import { Schemas, SchemaDocument } from '../schema/schemas.schema';
import { FilterQuery, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SchemaRepository {
  constructor(
    @InjectModel(Schemas.name)
    private readonly schemaModel: Model<SchemaDocument>,
  ) {}

  async findOne(schemaFilterQuery: FilterQuery<Schemas>): Promise<Schemas> {
    return this.schemaModel.findOne(schemaFilterQuery);
  }
  async find(schemaFilterQuery: FilterQuery<Schemas>): Promise<Schemas[]> {
    return this.schemaModel.distinct('schemaId', schemaFilterQuery);
  }

  async create(schema: Schemas): Promise<Schemas> {
    const newSchema = new this.schemaModel(schema);
    return newSchema.save();
  }

  async findOneAndUpdate(
    schemaFilterQuery: FilterQuery<Schemas>,
    schema: Partial<Schemas>,
  ): Promise<Schemas> {
    return this.schemaModel.findOneAndUpdate(schemaFilterQuery, schema, {
      new: true,
    });
  }
}
