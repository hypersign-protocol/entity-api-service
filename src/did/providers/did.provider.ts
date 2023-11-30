import { Connection } from 'mongoose';

import { DidSchema, DidMetaDataSchema } from '../schemas/did.schema';

export const didProviders = [
  {
    provide: 'DID_MODEL',
    useFactory: (connection: Connection) => connection.model('Did', DidSchema),
    inject: ['APPDATABASECONNECTIONS'],
  },
  {
    provide: 'DID_METADATA_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('DidMetaData', DidMetaDataSchema),
    inject: ['APPDATABASECONNECTIONS'],
  },
];
