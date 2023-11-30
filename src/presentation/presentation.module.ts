import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import {
  PresentationRequestService,
  PresentationService,
} from './services/presentation.service';
import {
  PresentationTempleteController,
  PresentationController,
} from './controllers/presentation.controller';
import {
  PresentationTemplate,
  PresentationTemplateSchema,
} from './schemas/presentation-template.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { PresentationTemplateRepository } from './repository/presentation-template.repository';
import { HidWalletService } from 'src/hid-wallet/services/hid-wallet.service';
import { DidModule } from 'src/did/did.module';
import { WhitelistSSICorsMiddleware } from 'src/utils/middleware/cors.middleware';
import { TrimMiddleware } from 'src/utils/middleware/trim.middleware';
import { presentationTemplateProviders } from './providers/presentation.provider';
import { databaseProviders } from '../mongoose/tenant-mongoose-connections';

@Module({
  imports: [DidModule],
  controllers: [PresentationTempleteController, PresentationController],
  providers: [
    PresentationService,
    PresentationTemplateRepository,
    PresentationRequestService,
    HidWalletService,
    ...databaseProviders,
    ...presentationTemplateProviders,
  ],
})
export class PresentationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(WhitelistSSICorsMiddleware)
      .forRoutes(PresentationTempleteController, PresentationController);
    consumer
      .apply(TrimMiddleware)
      .exclude(
        { path: 'presentation/template', method: RequestMethod.GET },
        {
          path: 'presentation/template/:templateId',
          method: RequestMethod.GET,
        },
        { path: 'presentation/template', method: RequestMethod.DELETE },
      )
      .forRoutes(PresentationTempleteController, PresentationController);
  }
}
