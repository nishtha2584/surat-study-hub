import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { UsersRepository } from './users.repository';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import { UserResponse } from './types/user-response.type';
import { UserRow } from './types/user-row.type'; // full DB
import { UserPublicRow } from './types/user-public-row.type'; // query-safe

@Injectable()
export class UsersService {
    constructor(private readonly repo: UsersRepository) { }

    /* =======================
       CREATE USER
    ======================= */
    async createUser(dto: CreateUserDto): Promise<UserResponse> {
        const existing = await this.repo.findByEmail(dto.email);

        if (existing.length > 0) {
            throw new BadRequestException('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const id = crypto.randomUUID();

        await this.repo.createUser(
            id,
            dto.name,
            dto.email,
            hashedPassword,
            dto.role,
        );

        const created = await this.repo.findById(id); // public row
        const user = created[0];

        if (!user) {
            throw new NotFoundException('User not found after creation');
        }

        return this.mapToResponse(user);
    }

    /* =======================
       GET ALL USERS
    ======================= */
    async getAllUsers(role?: string): Promise<UserResponse[]> {
        const users = await this.repo.findAll(role);
        return users.map((u) => this.mapToResponse(u));
    }


    /* =======================
       GET USER BY ID
    ======================= */
    async getUserById(id: string): Promise<UserResponse> {
        const users = await this.repo.findById(id); // UserPublicRow[]
        const user = users[0];

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.mapToResponse(user);
    }

    /* =======================
       UPDATE USER
    ======================= */
    async updateUser(
        id: string,
        dto: UpdateUserDto,
    ): Promise<UserResponse> {
        const users = await this.repo.findById(id);
        const existing = users[0];

        if (!existing) {
            throw new NotFoundException('User not found');
        }

        await this.repo.updateUser(id, dto.name, dto.email);

        const updated = await this.repo.findById(id);
        const user = updated[0];

        if (!user) {
            throw new NotFoundException('User not found after update');
        }

        return this.mapToResponse(user);
    }

    /* =======================
       DELETE USER
    ======================= */
    async deleteUser(id: string): Promise<void> {
        const users = await this.repo.findById(id);

        if (users.length === 0) {
            throw new NotFoundException('User not found');
        }

        await this.repo.deleteUser(id);
    }

    /* =======================
       CHANGE PASSWORD (SELF)
    ======================= */
    async changePassword(
        userId: string,
        dto: ChangePasswordDto,
    ): Promise<void> {
        // 🔥 IMPORTANT: use FULL row
        const users = await this.repo.findByIdWithPassword(userId);
        const user = users[0];

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isMatch = await bcrypt.compare(
            dto.oldPassword,
            user.password,
        );

        if (!isMatch) {
            throw new BadRequestException('Old password incorrect');
        }

        const newHashed = await bcrypt.hash(dto.newPassword, 10);

        await this.repo.updatePassword(userId, newHashed);
    }

    /* =======================
       RESET PASSWORD (ADMIN)
    ======================= */
    async resetPassword(
        userId: string,
        dto: ResetPasswordDto,
    ): Promise<void> {
        const users = await this.repo.findById(userId);

        if (users.length === 0) {
            throw new NotFoundException('User not found');
        }

        const hashed = await bcrypt.hash(dto.newPassword, 10);

        await this.repo.updatePassword(userId, hashed);
    }

    /* =======================
       LOCK USER
    ======================= */
    async lockUser(id: string): Promise<void> {
        const users = await this.repo.findById(id);

        if (users.length === 0) {
            throw new NotFoundException('User not found');
        }

        await this.repo.lockUser(id);
    }

    /* =======================
       UNLOCK USER
    ======================= */
    async unlockUser(id: string): Promise<void> {
        const users = await this.repo.findById(id);

        if (users.length === 0) {
            throw new NotFoundException('User not found');
        }

        await this.repo.unlockUser(id);
    }

    /* =======================
       MAPPER (STRICT)
    ======================= */
    private mapToResponse(user: UserPublicRow): UserResponse {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            is_locked: user.is_locked,
            created_at: user.created_at,
        };
    }
}