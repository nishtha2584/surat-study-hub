import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import * as crypto from 'crypto';
import { DatabaseService } from 'src/common/database/database.service';
import { RowDataPacket } from 'mysql2/promise';
import { RequestWithUser } from 'src/common/types/request-with-user.type';

type AccessTokenRow = RowDataPacket & {
    user_id: string;
    is_revoked: number; // MySQL returns 0/1
    expires_at: Date;
};

type JwtPayload = {
    sub: string;
    role: string;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly db: DatabaseService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<RequestWithUser>();

        // 🔹 1. Extract token
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('No token provided');
        }

        const token = authHeader.split(' ')[1];

        // 🔹 2. Verify JWT
        let payload: JwtPayload;

        try {
            payload = this.jwtService.verify<JwtPayload>(token);
        } catch {
            throw new UnauthorizedException('Invalid token');
        }

        // 🔹 3. Hash token
        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // 🔹 4. Check DB
        const rows = await this.db.query<AccessTokenRow[]>(
            `SELECT user_id, expires_at
             FROM access_tokens
             WHERE token_hash = ? AND is_revoked = 0`,
            [tokenHash],
        );

        const tokenData = rows[0];

        if (!tokenData) {
            throw new UnauthorizedException('Session expired');
        }

        if (new Date() > new Date(tokenData.expires_at)) {
            throw new UnauthorizedException('Session expired');
        }

        // 🔹 5. Attach user to request
        request['user'] = {
            userId: payload.sub,
            role: payload.role,
        };

        return true;
    }
}