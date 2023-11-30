import { Connection } from 'mongoose';

import { CredentialSchema } from '../schemas/credntial.schema';

export const credentialProviders = [
  {
    provide: 'CREDENTIAL_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('Credential', CredentialSchema),
    inject: ['APPDATABASECONNECTIONS'],
  },
];
