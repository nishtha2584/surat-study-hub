import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { RequestWithContext } from '../middleware/request-context.middleware';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const now = Date.now();

        const ctx = context.switchToHttp();
        const request = ctx.getRequest<RequestWithContext>();

        const { method, url } = request;

        // user will come later from JWT
        const userId = (request as Request & { user?: { id?: string } }).user?.id ?? 'Anonymous';

        return next.handle().pipe(
            tap(() => {
                const responseTime = Date.now() - now;

                console.log(
                    `[${request.requestId}] [${method}] ${url} | User: ${userId} | ${responseTime}ms`,
                );
            }),
        );
    }
}