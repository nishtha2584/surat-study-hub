import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { DatabaseService } from 'src/common/database/database.service';
import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import * as crypto from 'crypto';
import { EnrollmentBatchRow } from './types/enroll-batch-row.type';
import { BatchRow } from '../batches/types/batch-row.type';

@Injectable()
export class EnrollmentBatchRepository extends BaseRepository {
    constructor(protected readonly db: DatabaseService) {
        super(db);
    }
    async create(
        data: {
            enrollmentId: string;
            batchId: string;
        },
        conn?: PoolConnection,
    ): Promise<void> {
        const id = crypto.randomUUID();

        await this.execute(
            `INSERT INTO enrollment_batches
       (id, enrollment_id, batch_id)
       VALUES (?, ?, ?)`,
            [id, data.enrollmentId, data.batchId],
            conn,
        );
    }

    async existsActive(
        enrollmentId: string,
        batchId: string,
        conn?: PoolConnection,
    ): Promise<boolean> {
        const rows = await this.query<RowDataPacket[]>(
            `SELECT 1
       FROM enrollment_batches
       WHERE enrollment_id = ?
         AND batch_id = ?
         AND left_at IS NULL
       LIMIT 1`,
            [enrollmentId, batchId],
            conn,
        );

        return rows.length > 0;
    }

    async findBatchesWithDetailsByEnrollmentId(
        enrollmentId: string,
        conn?: PoolConnection,
    ): Promise<(BatchRow & { teacher_name: string; joined_at: Date; left_at: Date | null })[]> {
        return this.query<(BatchRow & { teacher_name: string; joined_at: Date; left_at: Date | null })[]>(
            `SELECT
          b.*,
          u.name AS teacher_name,
          eb.joined_at,
          eb.left_at
        FROM enrollment_batches eb
        JOIN batches b ON b.id = eb.batch_id
        LEFT JOIN users u ON u.id = b.teacher_id
        WHERE eb.enrollment_id = ?
          AND eb.left_at IS NULL`,
            [enrollmentId],
            conn,
        );
    }




    async leaveBatch(
        enrollmentId: string,
        batchId: string,
        conn?: PoolConnection,
    ): Promise<ResultSetHeader> {
        return this.execute(
            `UPDATE enrollment_batches
       SET left_at = NOW()
       WHERE enrollment_id = ?
         AND batch_id = ?
         AND left_at IS NULL`,
            [enrollmentId, batchId],
            conn,
        );
    }

    async findByBatchId(
        batchId: string,
        conn?: PoolConnection,
    ): Promise<EnrollmentBatchRow[]> {
        return this.query<EnrollmentBatchRow[]>(
            `SELECT *
       FROM enrollment_batches
       WHERE batch_id = ?
         AND left_at IS NULL`,
            [batchId],
            conn,
        );
    }
}

