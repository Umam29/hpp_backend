import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { parseNestedFormBody } from '../helpers/parse-nested-form-body';

@Injectable()
export class MultipartNestedBodyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.body && typeof request.body === 'object') {
      request.body = parseNestedFormBody(
        request.body as Record<string, unknown>,
      );
    }

    return next.handle();
  }
}
