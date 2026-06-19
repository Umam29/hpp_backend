import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { parseUserId } from '../helpers/parse-user-id';

export const UserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return parseUserId(request.headers.authorization);
  },
);
