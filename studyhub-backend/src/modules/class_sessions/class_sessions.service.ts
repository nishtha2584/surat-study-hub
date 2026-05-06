import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';

import { ClassSessionsRepository } from './class-sessions.repository';
import { ClassSessionRow } from './class-sessions.repository';

import { PoolConnection } from 'mysql2/promise';

@Injectable()
export class ClassSessionsService {
    constructor(
        private readonly repo: ClassSessionsRepository,
    ) { }

    /* =======================
       🔥 FIND OR CREATE SESSION
    ======================= */
    async findOrCreateSession(
        params: {
            batchId: string;
            date: string;
            startTime: string;
            endTime: string;
        },
        conn?: PoolConnection,
    ): Promise<ClassSessionRow> {

        const existing = await this.repo.findByBatchAndDate(
            params.batchId,
            params.date,
            conn,
        );

        if (existing) return existing;

        if (params.endTime <= params.startTime) {
            throw new BadRequestException(
                'End time must be greater than start time',
            );
        }

        return this.repo.createSession(
            {
                batchId: params.batchId,
                date: params.date,
                startTime: params.startTime,
                endTime: params.endTime,
            },
            conn,
        );
    }

    /* =======================
       GET SESSION BY ID
    ======================= */
    async getById(id: string): Promise<ClassSessionRow> {
        const session = await this.repo.findById(id);

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        return session;
    }

    /* =======================
       GET BY BATCH
    ======================= */
    async getByBatch(batchId: string): Promise<ClassSessionRow[]> {
        return this.repo.findByBatchId(batchId);
    }

    /* =======================
       GET BY BATCH + DATE RANGE
    ======================= */
    async getByBatchAndDateRange(
        batchId: string,
        fromDate: string,
        toDate: string,
    ): Promise<ClassSessionRow[]> {

        if (fromDate > toDate) {
            throw new BadRequestException(
                'Invalid date range: fromDate must be <= toDate',
            );
        }

        return this.repo.findByBatchAndDateRange(
            batchId,
            fromDate,
            toDate,
        );
    }

    /* =======================
       MARK SESSION COMPLETED
    ======================= */
    async markCompleted(id: string): Promise<ClassSessionRow> {
        const session = await this.repo.findById(id);

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        await this.repo.markCompleted(id);

        const updated = await this.repo.findById(id);
        if (!updated) throw new NotFoundException('Session not found');

        return updated;
    }
    /* =======================
       CANCEL SESSION
    ======================= */
    async cancelSession(id: string): Promise<ClassSessionRow> {
        const session = await this.repo.findById(id);

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        await this.repo.cancelSession(id);

        const updated = await this.repo.findById(id);
        if (!updated) throw new NotFoundException('Session not found');

        return updated;
    }
}