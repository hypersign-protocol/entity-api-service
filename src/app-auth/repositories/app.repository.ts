import { App, AppDocument } from '../schemas/app.schema';
import { FilterQuery, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppRepository {
  constructor(
    @InjectModel(App.name) private readonly appModel: Model<AppDocument>,
  ) {}

  async findOne(appFilterQuery: FilterQuery<App>): Promise<App> {
    return this.appModel.findOne(appFilterQuery).lean();
  }

  async find(appsFilterQuery: FilterQuery<App>): Promise<App[]> {
    return this.appModel
      .find({ userId: appsFilterQuery.userId })
      .skip(appsFilterQuery.paginationOption.skip)
      .limit(appsFilterQuery.paginationOption.limit);
  }

  async create(app: App): Promise<App> {
    const newapp = new this.appModel(app);
    return newapp.save();
  }

  async findOneAndUpdate(
    appFilterQuery: FilterQuery<App>,
    app: Partial<App>,
  ): Promise<App> {
    return this.appModel.findOneAndUpdate(appFilterQuery, app, { new: true });
  }
}
