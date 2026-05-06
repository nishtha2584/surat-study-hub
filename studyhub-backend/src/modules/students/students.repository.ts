import { RowDataPacket } from 'mysql2/promise';

export type StudentRow = RowDataPacket & {
    id: string;
    name: string;
    parent_name: string;
    phone: string;
    email: string | null;
    dob: Date;
    address: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    // joined from enrollments
    enrollment_id: string | null;
    enrollment_number: string | null;
    standard: string | null;
    payment_status: 'PAID' | 'PARTIAL' | 'PENDING' | null;
    total_monthly_fee: number | null;
    amount_paid: number | null;
    due_date: Date | null;
    academic_year: string | null;
    batch_count: number;
};



import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { DatabaseService } from 'src/common/database/database.service';
import {
    PoolConnection,
    ResultSetHeader,
} from 'mysql2/promise';
import { SqlParam } from 'src/common/types/sql-param.type';
import * as crypto from 'crypto';

@Injectable()
export class StudentsRepository extends BaseRepository {
    constructor(protected readonly db: DatabaseService) {
        super(db);
    }

    /* =======================
       CREATE STUDENT
    ======================= */
    async create(
        data: {
            name: string;
            parent_name: string;
            phone: string;
            email?: string | null;
            dob: string;
            address: string;
        },
        conn?: PoolConnection,
    ): Promise<StudentRow> {
        const id = crypto.randomUUID();

        await this.execute(
            `INSERT INTO students (
        id, name, parent_name, phone, email, dob, address
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                data.name,
                data.parent_name,
                data.phone,
                data.email || null,
                data.dob,
                data.address,
            ],
            conn,
        );


        const rows = await this.query<StudentRow[]>(
            `SELECT * FROM students WHERE id = ?`,
            [id],
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
    ): Promise<StudentRow | undefined> {
        const rows = await this.query<StudentRow[]>(
            `SELECT
          s.*,
          ANY_VALUE(e.id)                AS enrollment_id,
          ANY_VALUE(e.enrollment_number) AS enrollment_number,
          ANY_VALUE(e.standard)          AS standard,
          ANY_VALUE(e.payment_status)    AS payment_status,
          ANY_VALUE(e.total_monthly_fee) AS total_monthly_fee,
          ANY_VALUE(e.amount_paid)       AS amount_paid,
          ANY_VALUE(e.due_date)          AS due_date,
          ANY_VALUE(e.academic_year)     AS academic_year,
          COUNT(DISTINCT eb.batch_id)    AS batch_count
        FROM students s
        LEFT JOIN enrollments e
          ON e.student_id = s.id AND e.deleted_at IS NULL
        LEFT JOIN enrollment_batches eb
          ON eb.enrollment_id = e.id AND eb.left_at IS NULL
        WHERE s.id = ? AND s.deleted_at IS NULL
        GROUP BY s.id
        LIMIT 1`,

            [id],
            conn,
        );

        return rows[0];
    }


    /* =======================
       FIND ALL (PAGINATION)
    ======================= */
    async findAll(
        params: { offset: number; limit: number; search?: string; paymentStatus?: string },
        conn?: PoolConnection,
    ): Promise<StudentRow[]> {
        let sql = `
      SELECT
        s.*,
        e.enrollment_number,
        e.payment_status,
        e.total_monthly_fee,
        e.id AS enrollment_id,
        (SELECT COUNT(*) FROM enrollment_batches eb WHERE eb.enrollment_id = e.id AND eb.left_at IS NULL) AS batch_count
      FROM students s
      LEFT JOIN enrollments e
        ON e.id = (
          SELECT id FROM enrollments
          WHERE student_id = s.id AND deleted_at IS NULL
          ORDER BY created_at DESC
          LIMIT 1
        )
      WHERE s.deleted_at IS NULL`;

        const values: SqlParam[] = [];

        if (params.search) {
            sql += ` AND (s.name LIKE ? OR s.phone LIKE ? OR e.enrollment_number LIKE ?)`;
            values.push(`%${params.search}%`, `%${params.search}%`, `%${params.search}%`);
        }

        if (params.paymentStatus) {
            sql += ` AND e.payment_status = ?`;
            values.push(params.paymentStatus);
        }

        sql += ` ORDER BY s.created_at DESC LIMIT ?, ?`;

        values.push(params.offset, params.limit);

        return this.query<StudentRow[]>(sql, values, conn);
    }


    async countAll(
        params: { search?: string; paymentStatus?: string },
        conn?: PoolConnection,
    ): Promise<number> {
        let sql = `
      SELECT COUNT(*) as count
      FROM students s
      LEFT JOIN enrollments e
        ON e.id = (
          SELECT id FROM enrollments
          WHERE student_id = s.id AND deleted_at IS NULL
          ORDER BY created_at DESC
          LIMIT 1
        )
      WHERE s.deleted_at IS NULL`;

        const values: SqlParam[] = [];

        if (params.search) {
            sql += ` AND (s.name LIKE ? OR s.phone LIKE ? OR e.enrollment_number LIKE ?)`;
            values.push(`%${params.search}%`, `%${params.search}%`, `%${params.search}%`);
        }

        if (params.paymentStatus) {
            sql += ` AND e.payment_status = ?`;
            values.push(params.paymentStatus);
        }


        const rows = await this.query<(RowDataPacket & { count: number })[]>(
            sql,
            values,
            conn,
        );

        return rows[0]?.count ?? 0;
    }



    /* =======================
       SEARCH (OPTIONAL 🔥)
    ======================= */
    async search(
        query: string,
        conn?: PoolConnection,
    ): Promise<StudentRow[]> {
        return this.query<StudentRow[]>(
            `SELECT *
       FROM students
       WHERE deleted_at IS NULL
         AND (
           name LIKE ?
           OR email LIKE ?
           OR phone LIKE ?
         )`,
            [`%${query}%`, `%${query}%`, `%${query}%`],
            conn,
        );
    }

    /* =======================
       UPDATE STUDENT
    ======================= */
    async update(
        id: string,
        fields: Record<string, SqlParam>,
        conn?: PoolConnection,
    ): Promise<ResultSetHeader> {
        const keys = Object.keys(fields);

        if (keys.length === 0) {
            throw new Error('No fields to update');
        }

        const setClause = keys.map((k) => `${k} = ?`).join(', ');
        const values = Object.values(fields);

        return this.execute(
            `UPDATE students
       SET ${setClause}
       WHERE id = ?`,
            [...values, id],
            conn,
        );
    }

    /* =======================
       SOFT DELETE
    ======================= */
    async softDelete(
        id: string,
        conn?: PoolConnection,
    ): Promise<ResultSetHeader> {
        return this.execute(
            `UPDATE students
       SET deleted_at = NOW()
       WHERE id = ?`,
            [id],
            conn,
        );
    }

    /* =======================
       EXISTS (for validation)
    ======================= */
    async exists(
        id: string,
        conn?: PoolConnection,
    ): Promise<boolean> {
        const rows = await this.query<RowDataPacket[]>(
            `SELECT 1
       FROM students
       WHERE id = ?
         AND deleted_at IS NULL
       LIMIT 1`,
            [id],
            conn,
        );

        return rows.length > 0;
    }
}