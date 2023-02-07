import { Injectable } from '@nestjs/common';
import {AppAPIKey,AppAPIKeyDocument} from '../schemas/app-apikey.schema'
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';

@Injectable()

export class ApiKeyRepository{
    constructor (
        @InjectModel(AppAPIKey.name) private readonly apiKeyModel:Model<AppAPIKey>
    ){}



    async create(apiKey:AppAPIKey){
        const newApiKey=new this.apiKeyModel(apiKey)
        return newApiKey.save()
    }





    async findOne(apiKeyFilterQuery:FilterQuery<AppAPIKey>):Promise<AppAPIKey>{

        return this.apiKeyModel.findOne(apiKeyFilterQuery)

    }


    async findOneAndDelete(apiKeyFilterQuery:FilterQuery<AppAPIKey>):Promise<AppAPIKey>{
        return this.apiKeyModel.findOneAndDelete(apiKeyFilterQuery)
    }





}