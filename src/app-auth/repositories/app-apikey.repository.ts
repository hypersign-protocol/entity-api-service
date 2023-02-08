import { Injectable } from '@nestjs/common';
import {ApiSecret,ApiSecretDocument} from '../schemas/app-apikey.schema'
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';

@Injectable()

export class ApiKeyRepository{
    constructor (
        @InjectModel(ApiSecret.name) private readonly apiKeyModel:Model<ApiSecret>
    ){}



    async create(apiKey:ApiSecret){
        const newApiKey=new this.apiKeyModel(apiKey)
        return newApiKey.save()
    }


    async findAll(apiKeyFilterQuery:FilterQuery<ApiSecret>){
        return this.apiKeyModel.find(apiKeyFilterQuery)
    }



    async findOne(apiKeyFilterQuery:FilterQuery<ApiSecret>):Promise<ApiSecret>{

        return this.apiKeyModel.findOne(apiKeyFilterQuery)

    }


    async findOneAndDelete(apiKeyFilterQuery:FilterQuery<ApiSecret>):Promise<ApiSecret>{
        return this.apiKeyModel.findOneAndDelete(apiKeyFilterQuery)
    }





}