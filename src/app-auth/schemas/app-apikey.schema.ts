import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { Date, Document } from 'mongoose';
import { App, AppSchema } from "./app.schema";
import { IsOptional } from "class-validator";


export type AppAPIKeyDocument = AppAPIKey & Document;

@Schema()
export class AppAPIKey {

    @ApiHideProperty()
    @Prop()
    appId: string
    @ApiHideProperty()
    @Prop()
    apiSecret: string;

    @ApiHideProperty()
    @Prop()
    apiKey: string;

    @ApiHideProperty()
    @Prop()
    permissions: Array<string>
    @ApiHideProperty()
    @Prop()
    userId:string

    @ApiHideProperty()
    @IsOptional()
    @Prop({ default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),type:Date, required:false })
    validTill:Date

}


export class createApiKeyResp  {
    @ApiProperty({
      description: 'Application Key',
      example: '${prefix}.{secret}',
    })
    @Prop()
    apiKey: string;
  }

const APIKeySchema = SchemaFactory.createForClass(AppAPIKey)
APIKeySchema.index({
    apiSecret: 1,
    apiKey: 1
}, { unique: true }
)

APIKeySchema.index({appId:1,userId:1},{unique:true})
APIKeySchema.index({vaidTill:1},{expireAfterSeconds:0})

export {APIKeySchema}
