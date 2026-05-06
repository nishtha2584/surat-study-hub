import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface RequestWithContext extends Request {
    requestId: string;
    startTime: number;
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
    use(req: RequestWithContext, res: Response, next: NextFunction): void {
        req.requestId = randomUUID();
        req.startTime = Date.now();

        next();
    }
}