import { RowDataPacket } from 'mysql2/promise';


import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { DatabaseService } from 'src/common/database/database.service';
import {
    PoolConnection,
    ResultSetHeader,
} from 'mysql2/promise';
import * as crypto from 'crypto';
import { SqlParam } from 'src/common/types/sql-param.type';
import { AttendanceRow } from './types/attendance-row.type';

@Injectable()
export class AttendanceRepository extends BaseRepository {
    constructor(protected readonly db: DatabaseService) {
        super(db);
    }

    /* =======================
       CREATE ATTENDANCE
    ======================= */
    async create(
        data: {
            studentId: string;
            sessionId: string;
            status: AttendanceRow['status'];
            note?: string | null;
        },
        conn?: PoolConnection,
    ): Promise<AttendanceRow> {
        const id = crypto.randomUUID();

        await this.execute(
            `INSERT INTO attendance (
        id, student_id, session_id, status, note
      )
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        status = VALUES(status), 
        note = VALUES(note)`,
            [
                id,
                data.studentId,
                data.sessionId,
                data.status,
                data.note ?? null,
            ],
            conn,
        );

        const rows = await this.query<AttendanceRow[]>(
            `SELECT * FROM attendance WHERE student_id = ? AND session_id = ?`,
            [data.studentId, data.sessionId],
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
    ): Promise<AttendanceRow | undefined> {
        const rows = await this.query<AttendanceRow[]>(
            `SELECT *
       FROM attendance
       WHERE id = ?
       LIMIT 1`,
            [id],
            conn,
        );

        return rows[0];
    }

    /* =======================
       FIND BY SESSION
    ======================= */
    async findBySessionId(
        sessionId: string,
        conn?: PoolConnection,
    ): Promise<AttendanceRow[]> {
        return this.query<AttendanceRow[]>(
            `SELECT *
       FROM attendance
       WHERE session_id = ?`,
            [sessionId],
            conn,
        );
    }

    /* =======================
       FIND BY STUDENT
    ======================= */
    async findByStudentId(
        studentId: string,
        conn?: PoolConnection,
    ): Promise<AttendanceRow[]> {
        return this.query<AttendanceRow[]>(
            `SELECT *
       FROM attendance
       WHERE student_id = ?
       ORDER BY created_at DESC`,
            [studentId],
            conn,
        );
    }

    /* =======================
       FIND BY SESSION + STUDENT
    ======================= */
    async findByStudentAndSession(
        studentId: string,
        sessionId: string,
        conn?: PoolConnection,
    ): Promise<AttendanceRow | undefined> {
        const rows = await this.query<AttendanceRow[]>(
            `SELECT *
       FROM attendance
       WHERE student_id = ?
         AND session_id = ?
       LIMIT 1`,
            [studentId, sessionId],
            conn,
        );

        return rows[0];
    }

    /* =======================
       FIND BY SESSION (WITH STUDENT INFO)
       (useful for UI / reports)
    ======================= */
    async findWithStudentBySession(
        sessionId: string,
        conn?: PoolConnection,
    ): Promise<RowDataPacket[]> {
        return this.query<RowDataPacket[]>(
            `SELECT 
          a.*,
          s.name AS student_name
       FROM attendance a
       JOIN students s ON s.id = a.student_id
       WHERE a.session_id = ?`,
            [sessionId],
            conn,
        );
    }

    /* =======================
       UPDATE STATUS
    ======================= */
    async updateStatus(
        id: string,
        status: AttendanceRow['status'],
        note?: string | null,
        conn?: PoolConnection,
    ): Promise<ResultSetHeader> {
        return this.execute(
            `UPDATE attendance
       SET status = ?, note = ?
       WHERE id = ?`,
            [status, note ?? null, id],
            conn,
        );
    }

    /* =======================
       BULK INSERT (OPTIONAL 🔥)
       (for marking full class at once)
    ======================= */
    async bulkCreate(
        data: {
            studentId: string;
            sessionId: string;
            status: AttendanceRow['status'];
            note?: string | null;
        }[],
        conn?: PoolConnection,
    ): Promise<void> {
        if (data.length === 0) return;

        const values: SqlParam[] = [];
        const placeholders = data
            .map(() => '(?, ?, ?, ?, ?)')
            .join(',');

        for (const item of data) {
            values.push(
                crypto.randomUUID() as SqlParam,
                item.studentId,
                item.sessionId,
                item.status,
                item.note ?? null,
            );
        }

        await this.execute(
            `INSERT INTO attendance (
        id, student_id, session_id, status, note
      )
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        note = VALUES(note)`,
            values,
            conn,
        );
    }

    /* =======================
       DELETE (RARE USE)
    ======================= */
    async delete(
        id: string,
        conn?: PoolConnection,
    ): Promise<ResultSetHeader> {
        return this.execute(
            `DELETE FROM attendance WHERE id = ?`,
            [id],
            conn,
        );
    }
}