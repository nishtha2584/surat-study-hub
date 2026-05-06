import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { DatabaseService } from 'src/common/database/database.service';
import { RowDataPacket } from 'mysql2/promise';
import * as crypto from 'crypto';

/* =======================
   TYPES
======================= */

type UserRow = RowDataPacket & {
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    failed_attempts: number;
    is_locked: number; // ⚠️ MySQL → number (0/1)
    lock_until: Date | null;
};

type MeRow = RowDataPacket & {
    id: string;
    name: string;
    email: string;
    role: string;
};

type RefreshTokenRow = RowDataPacket & {
    id: string;
    user_id: string;
    expires_at: Date;
    is_revoked: number;
    role: string; // 🔥 needed for JWT
    device_id: string;
};

@Injectable()
export class AuthRepository extends BaseRepository {
    constructor(protected readonly db: DatabaseService) {
        super(db);
    }

    /* =======================
       USER METHODS
    ======================= */

    async findByEmail(email: string): Promise<UserRow[]> {
        return this.query<UserRow[]>(
            `SELECT id, name, email, password, role, failed_attempts, is_locked, lock_until
             FROM users
             WHERE email = ? AND deleted_at IS NULL`,
            [email],
        );
    }

    async findByEmailWithLock(email: string): Promise<UserRow[]> {
        return this.findByEmail(email); // reuse ✔
    }

    async findById(userId: string): Promise<MeRow[]> {
        return this.query<MeRow[]>(
            `SELECT id, name, email, role
             FROM users
             WHERE id = ? AND deleted_at IS NULL`,
            [userId],
        );
    }

    async incrementFailedAttempts(userId: string): Promise<void> {
        await this.execute(
            `UPDATE users 
             SET failed_attempts = failed_attempts + 1 
             WHERE id = ?`,
            [userId],
        );
    }

    async resetFailedAttempts(userId: string): Promise<void> {
        await this.execute(
            `UPDATE users 
             SET failed_attempts = 0 
             WHERE id = ?`,
            [userId],
        );
    }

    async lockUser(userId: string): Promise<void> {
        await this.execute(
            `UPDATE users 
             SET is_locked = 1,
             lock_until = DATE_ADD(NOW(), INTERVAL 2 MINUTE)

             WHERE id = ?`,
            [userId],
        );
    }

    async resetLock(userId: string): Promise<void> {
        await this.execute(
            `UPDATE users 
             SET is_locked = 0,
             lock_until = NULL
             WHERE id = ?`,
            [userId],
        );
    }

    /* =======================
       REFRESH TOKENS
    ======================= */

    async storeRefreshToken(
        userId: string,
        tokenHash: string,
        deviceId: string,
        expiresAt: Date,
    ): Promise<string> {
        const id = crypto.randomUUID();

        await this.execute(
            `INSERT INTO refresh_tokens 
             (id, user_id, token_hash, device_id, expires_at)
             VALUES (?, ?, ?, ?, ?)`,
            [id, userId, tokenHash, deviceId, expiresAt],
        );

        return id;
    }

    async findValidRefreshToken(
        tokenHash: string,
    ): Promise<RefreshTokenRow | undefined> {
        const rows = await this.query<RefreshTokenRow[]>(
            `SELECT rt.id, rt.user_id, rt.expires_at, rt.is_revoked, u.role, rt.device_id
             FROM refresh_tokens rt
             JOIN users u ON u.id = rt.user_id
             WHERE rt.token_hash = ? AND u.deleted_at IS NULL`,
            [tokenHash],
        );

        return rows[0];
    }

    async revokeRefreshToken(tokenHash: string): Promise<void> {
        await this.execute(
            `UPDATE refresh_tokens 
             SET is_revoked = 1 
             WHERE token_hash = ?`,
            [tokenHash],
        );
    }

    async revokeAllUserTokens(userId: string): Promise<void> {
        await this.execute(
            `UPDATE refresh_tokens 
             SET is_revoked = 1 
             WHERE user_id = ?`,
            [userId],
        );
    }

    /* =======================
       ACCESS TOKENS
    ======================= */

    async storeAccessToken(
        userId: string,
        tokenHash: string,
        deviceId: string,
        refreshTokenId: string,
        expiresAt: Date,
    ): Promise<void> {
        const id = crypto.randomUUID();

        await this.execute(
            `INSERT INTO access_tokens 
             (id, token_hash, user_id, device_id, refresh_token_id, expires_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id, tokenHash, userId, deviceId, refreshTokenId, expiresAt],
        );
    }

    async revokeAccessTokensByRefreshId(
        refreshTokenId: string,
    ): Promise<void> {
        await this.execute(
            `UPDATE access_tokens 
     SET is_revoked = 1 
     WHERE refresh_token_id = ?`,
            [refreshTokenId],
        );
    }
}