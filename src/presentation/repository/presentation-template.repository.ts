import {
  PresentationTemplate,
  PresentationTemplateDocument,
} from '../schemas/presentation-template.schema';
import { FilterQuery, Model } from 'mongoose';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PresentationTemplateRepository {
  constructor(
    @Inject('PRESENTATION_MODEL')
    private readonly presentationTemplateModel: Model<PresentationTemplateDocument>,
  ) {}
  async findOne(
    presentationTemplateFilterQuery: FilterQuery<PresentationTemplate>,
  ): Promise<PresentationTemplate> {
    Logger.log(
      'findOne() method: starts, finding particular presentation template from db',
      'PresentationTemplateRepository',
    );
    return this.presentationTemplateModel
      .findOne(presentationTemplateFilterQuery, { __v: 0 })
      .lean();
  }
  async find(
    presentationTemplateFilterQuery: FilterQuery<PresentationTemplate>,
  ): Promise<PresentationTemplate[]> {
    Logger.log(
      'find() method: starts, fetching list of presentation templates from db',
      'PresentationTemplateRepository',
    );
    return await this.presentationTemplateModel.aggregate([
      { $match: { appId: presentationTemplateFilterQuery.appId } },
      {
        $facet: {
          totalCount: [{ $count: 'total' }],
          data: [
            { $skip: presentationTemplateFilterQuery.paginationOption.skip },
            { $limit: presentationTemplateFilterQuery.paginationOption.limit },
          ],
        },
      },
    ]);
  }

  async create(
    presentationTemplate: PresentationTemplate,
  ): Promise<PresentationTemplate> {
    Logger.log(
      'create() method: starts, adding new document for presentation template from db',
      'PresentationTemplateRepository',
    );
    const newPresentationTemplate = new this.presentationTemplateModel(
      presentationTemplate,
    );
    return newPresentationTemplate.save();
  }

  async findOneAndUpdate(
    presentationTemplateFilterQuery: FilterQuery<PresentationTemplate>,
    presentationTemplate: Partial<PresentationTemplate>,
  ): Promise<PresentationTemplate> {
    Logger.log(
      'findOneAndUpdate() method: starts, updatingpresentation template in db',
      'PresentationTemplateRepository',
    );
    return this.presentationTemplateModel.findOneAndUpdate(
      presentationTemplateFilterQuery,
      presentationTemplate,
      {
        new: true,
      },
    );
  }

  async findOneAndDelete(
    presentationTemplateFilterQuery: FilterQuery<PresentationTemplate>,
  ): Promise<PresentationTemplate> {
    Logger.log(
      'findOneAndDelete() method: starts.....',
      'PresentationTemplateRepository',
    );

    return this.presentationTemplateModel.findOneAndDelete(
      presentationTemplateFilterQuery,
    );
  }
}
