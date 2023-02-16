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
import { EdvService } from 'src/edv/services/edv.service';
import { DidModule } from 'src/did/did.module';
import { AppAuthModule } from 'src/app-auth/app-auth.module';
import { WhitelistMiddleware } from 'src/utils/middleware/cors.middleware';
import { TrimMiddleware } from 'src/utils/middleware/trim.middleware';
@Module({
  imports: [
    DidModule,
    AppAuthModule,
    MongooseModule.forFeature([
      {
        name: PresentationTemplate.name,
        schema: PresentationTemplateSchema,
      },
    ]),
  ],
  controllers: [PresentationTempleteController, PresentationController],
  providers: [
    PresentationService,
    PresentationTemplateRepository,
    PresentationRequestService,
    HidWalletService,
    EdvService,
  ],
})
export class PresentationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(WhitelistMiddleware)
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
