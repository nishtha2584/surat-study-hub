import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { DatabaseService } from 'src/common/database/database.service';
import {
    PoolConnection,
    RowDataPacket,
    ResultSetHeader,
} from 'mysql2/promise';
import * as crypto from 'crypto';

/* =======================
   TYPES
======================= */

export type ClassSessionRow = RowDataPacket & {
    id: string;
    batch_id: string;
    date: Date;
    start_time: string;
    end_time: string;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
    teacher_status: 'PRESENT' | 'ABSENT';
    substitute_teacher_id: string | null;
    is_compensation: number;
    created_at: Date;
};

@Injectable()
export class ClassSessionsRepository extends BaseRepository {
    constructor(protected readonly db: DatabaseService) {
        super(db);
    }

    /* =======================
       FIND BY BATCH + DATE
    ======================= */
    async findByBatchAndDate(
        batchId: string,
        date: string,
        conn?: PoolConnection,
    ): Promise<ClassSessionRow | undefined> {
        const rows = await this.query<ClassSessionRow[]>(
            `SELECT *
       FROM class_sessions
       WHERE batch_id = ?
         AND date = ?
       LIMIT 1`,
            [batchId, date],
            conn,
        );

        return rows[0];
    }

    /* =======================
       FIND BY ID
    ======================= */
    async findById(
        id: string,
        conn?: PoolConnection,
    ): Promise<ClassSessionRow | undefined> {
        const rows = await this.query<ClassSessionRow[]>(
            `SELECT *
       FROM class_sessions
       WHERE id = ?
       LIMIT 1`,
            [id],
            conn,
        );

        return rows[0];
    }

    /* =======================
       CREATE SESSION
    ======================= */
    async createSession(
        data: {
            batchId: string;
            date: string;
            startTime: string;
            endTime: string;
            status?: ClassSessionRow['status'];
            isCompensation?: number;
        },
        conn?: PoolConnection,
    ): Promise<ClassSessionRow> {
        const id = crypto.randomUUID();

        await this.execute(
            `INSERT INTO class_sessions (
        id, batch_id, date, start_time, end_time,
        status, is_compensation
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                data.batchId,
                data.date,
                data.startTime,
                data.endTime,
                data.status ?? 'SCHEDULED',
                data.isCompensation ?? 0,
            ],
            conn,
        );

        const rows = await this.query<ClassSessionRow[]>(
            `SELECT * FROM class_sessions WHERE id = ?`,
            [id],
            conn,
        );

        return rows[0];
    }

    /* =======================
       FIND BY BATCH (LIST)
    ======================= */
    async findByBatchId(
        batchId: string,
        conn?: PoolConnection,
    ): Promise<ClassSessionRow[]> {
        return this.query<ClassSessionRow[]>(
            `SELECT *
       FROM class_sessions
       WHERE batch_id = ?
       ORDER BY date DESC`,
            [batchId],
            conn,
        );
    }

    /* =======================
       FIND BY BATCH + DATE RANGE
       (for reports / attendance %)
    ======================= */
    async findByBatchAndDateRange(
        batchId: string,
        fromDate: string,
        toDate: string,
        conn?: PoolConnection,
    ): Promise<ClassSessionRow[]> {
        return this.query<ClassSessionRow[]>(
            `SELECT *
       FROM class_sessions
       WHERE batch_id = ?
         AND date BETWEEN ? AND ?
       ORDER BY date ASC`,
            [batchId, fromDate, toDate],
            conn,
        );
    }

    /* =======================
       UPDATE STATUS
    ======================= */
    async updateStatus(
        sessionId: string,
        status: ClassSessionRow['status'],
        conn?: PoolConnection,
    ): Promise<ResultSetHeader> {
        return this.execute(
            `UPDATE class_sessions
       SET status = ?
       WHERE id = ?`,
            [status, sessionId],
            conn,
        );
    }

    /* =======================
       MARK COMPLETED
    ======================= */
    async markCompleted(
        sessionId: string,
        conn?: PoolConnection,
    ): Promise<ResultSetHeader> {
        return this.updateStatus(sessionId, 'COMPLETED', conn);
    }

    /* =======================
       CANCEL SESSION
    ======================= */
    async cancelSession(
        sessionId: string,
        conn?: PoolConnection,
    ): Promise<ResultSetHeader> {
        return this.updateStatus(sessionId, 'CANCELLED', conn);
    }

    /* =======================
       UPDATE TEACHER ATTENDANCE (🔥)
    ======================= */
    async updateTeacherAttendance(
        sessionId: string,
        status: 'PRESENT' | 'ABSENT',
        substituteId: string | null = null,
        conn?: PoolConnection,
    ): Promise<ResultSetHeader> {
        return this.execute(
            `UPDATE class_sessions
       SET teacher_status = ?, 
           substitute_teacher_id = ?
       WHERE id = ?`,
            [status, substituteId, sessionId],
            conn,
        );
    }
}