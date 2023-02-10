import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { App } from '../schemas/app.schema';

export interface Response {
  totalCount: number;
  data: App;
}
@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response> {
    return next.handle().pipe(
      map((data) => {
        const modifiedResponse = {
          totalCount: data[0]['totalCount'][0].total,
          data: data[0]['data'],
        };
        return modifiedResponse;
      }),
    );
  }
}
