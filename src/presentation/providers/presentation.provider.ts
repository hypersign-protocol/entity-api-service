import { Connection } from 'mongoose';

import { PresentationTemplateSchema } from '../schemas/presentation-template.schema';

export const presentationTemplateProviders = [
  {
    provide: 'PRESENTATION_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('PresentationTemplate', PresentationTemplateSchema),
    inject: ['APPDATABASECONNECTIONS'],
  },
];
