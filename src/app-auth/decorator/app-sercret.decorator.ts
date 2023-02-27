import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const AppSecretHeader = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (
      !request.headers['x-api-secret-key'] ||
      request.headers['x-api-secret-key'] == undefined
    ) {
      throw new UnauthorizedException(['x-api-secret-key header is missing']);
    }
    return request.headers['x-api-secret-key'];
  },
);
