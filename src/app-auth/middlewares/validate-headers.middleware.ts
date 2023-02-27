import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ValidateHeadersMiddleware implements NestMiddleware {
  async use(req: any, res: any, next: () => void) {
    const userId = req.headers.userid;
    if (!userId) {
      throw new BadRequestException([
        'userId can not be null or empty',
        'userId is not passed',
      ]);
    }
    req.userId = userId;
    next();
  }
}
