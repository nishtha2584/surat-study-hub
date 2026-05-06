import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { AuthRepository } from './auth.repository';

import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';

import { LoginResponse } from './types/login-response.type';
import { RefreshResponse } from './types/refresh-response.type';
import { LogoutResponse } from './types/logout-response.type';
import { MeResponse } from './types/me-response.type';

@Injectable()
export class AuthService {
    constructor(
        private readonly repo: AuthRepository,
        private readonly jwtService: JwtService,
    ) { }

    /* =======================
       LOGIN
    ======================= */
    async login(dto: LoginDto): Promise<LoginResponse> {
        const users = await this.repo.findByEmailWithLock(dto.email);
        const user = users[0];

        if (!user) {
            throw new UnauthorizedException('User not registered');
        }

        // 🔒 Lock check
        if (user.is_locked === 1 && user.lock_until) {
            const lockUntil = new Date(user.lock_until);
            if (new Date() < lockUntil) {
                console.log('Sending lockout with time:', lockUntil.toISOString());
                throw new ForbiddenException({
                    message: 'Account locked due to 5 failed attempts.',
                    lockUntil: lockUntil.toISOString(),
                });
            }

        }

        // 🔑 Password validation
        const isMatch = await bcrypt.compare(dto.password, user.password);

        if (!isMatch) {
            const attempts = user.failed_attempts + 1;

            await this.repo.incrementFailedAttempts(user.id);

            if (attempts >= 5) {
                await this.repo.lockUser(user.id);
            }

            throw new UnauthorizedException('Invalid credentials');
        }

        // ✅ Reset security state
        await this.repo.resetFailedAttempts(user.id);
        await this.repo.resetLock(user.id);

        const payload = {
            sub: user.id,
            role: user.role,
        };

        const accessToken = this.jwtService.sign(payload);

        /* =======================
           REFRESH TOKEN
        ======================= */
        const refreshToken = crypto.randomBytes(64).toString('hex');

        const refreshTokenHash = crypto
            .createHash('sha256')
            .update(refreshToken)
            .digest('hex');

        const refreshExpires = new Date();
        refreshExpires.setDate(refreshExpires.getDate() + 7);

        const deviceId = crypto.randomUUID();

        const refreshTokenId = await this.repo.storeRefreshToken(
            user.id,
            refreshTokenHash,
            deviceId,
            refreshExpires,
        );

        /* =======================
           ACCESS TOKEN TRACKING
        ======================= */
        const accessTokenHash = crypto
            .createHash('sha256')
            .update(accessToken)
            .digest('hex');

        const accessExpires = new Date();
        accessExpires.setMinutes(accessExpires.getMinutes() + 15);

        await this.repo.storeAccessToken(
            user.id,
            accessTokenHash,
            deviceId,
            refreshTokenId,
            accessExpires,
        );

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    }

    /* =======================
       REFRESH TOKEN
    ======================= */
    async refresh(dto: RefreshDto): Promise<RefreshResponse> {
        const tokenHash = crypto
            .createHash('sha256')
            .update(dto.refreshToken)
            .digest('hex');

        const tokenData = await this.repo.findValidRefreshToken(tokenHash);

        if (!tokenData) {
            throw new UnauthorizedException('Invalid session');
        }

        if (tokenData.is_revoked === 1) {
            throw new UnauthorizedException('Session expired');
        }

        if (new Date() > new Date(tokenData.expires_at)) {
            throw new UnauthorizedException('Session expired');
        }

        await this.repo.revokeAccessTokensByRefreshId(tokenData.id);

        const payload = {
            sub: tokenData.user_id,
            role: tokenData.role,
        };

        const accessToken = this.jwtService.sign(payload);

        const accessTokenHash = crypto
            .createHash('sha256')
            .update(accessToken)
            .digest('hex');

        const accessExpires = new Date();
        accessExpires.setMinutes(accessExpires.getMinutes() + 15);

        await this.repo.storeAccessToken(
            tokenData.user_id,
            accessTokenHash,
            tokenData.device_id,
            tokenData.id,
            accessExpires,
        );

        return { accessToken };
    }

    /* =======================
       LOGOUT
    ======================= */
    async logout(dto: LogoutDto): Promise<LogoutResponse> {
        const tokenHash = crypto
            .createHash('sha256')
            .update(dto.refreshToken)
            .digest('hex');

        const tokenData = await this.repo.findValidRefreshToken(tokenHash);

        if (!tokenData) {
            throw new UnauthorizedException('Invalid session');
        }

        if (tokenData.is_revoked === 1) {
            throw new UnauthorizedException('Already logged out');
        }

        await this.repo.revokeRefreshToken(tokenHash);
        await this.repo.revokeAccessTokensByRefreshId(tokenData.id);

        return {
            message: 'Logged out successfully',
        };
    }

    /* =======================
       LOGOUT ALL
    ======================= */
    async logoutAll(userId: string): Promise<LogoutResponse> {
        await this.repo.revokeAllUserTokens(userId);

        return {
            message: 'Logged out from all devices',
        };
    }

    /* =======================
       CURRENT USER
    ======================= */
    async getMe(userId: string): Promise<MeResponse> {
        const users = await this.repo.findById(userId);
        const user = users[0];

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
    }
}