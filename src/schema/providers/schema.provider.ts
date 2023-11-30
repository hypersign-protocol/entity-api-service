import { Connection } from 'mongoose';

import { SchemasSchema } from '../schemas/schemas.schema';

export const schemaProviders = [
  {
    provide: 'SCHEMA_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('Schema', SchemasSchema),
    inject: ['APPDATABASECONNECTIONS'],
  },
];
