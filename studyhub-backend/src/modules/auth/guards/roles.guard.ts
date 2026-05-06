import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

type RequestWithUser = Request & {
    user: {
        userId: string;
        role: string;
    };
};

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        // 🔹 if no roles defined → allow
        if (!requiredRoles) {
            return true;
        }

        const request =
            context.switchToHttp().getRequest<RequestWithUser>();

        const user = request.user;

        if (!user) {
            throw new ForbiddenException('User not found in request');
        }

        const hasRole = requiredRoles.includes(user.role);

        if (!hasRole) {
            throw new ForbiddenException('Access denied');
        }

        return true;
    }
}