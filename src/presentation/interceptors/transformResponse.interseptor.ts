import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PresentationTemplate } from '../schemas/presentation-template.schema';
export interface Response {
  totalCount: number;
  data: Array<PresentationTemplate>;
}
@Injectable()
export class TemplateResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response> {
    return next.handle().pipe(
      map((data) => {
        const modifiedResponse = {
          totalCount:
            data[0]['totalCount'].length > 0
              ? data[0]['totalCount'][0].total
              : 0,
          data: data[0].data,
        };
        return modifiedResponse;
      }),
    );
  }
}
