import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { DatabaseService } from 'src/common/database/database.service';
import { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import * as crypto from 'crypto';
import { EnrollmentRow } from './types/enroll-row.type';
import { SqlParam } from 'src/common/types/sql-param.type';

@Injectable()
export class EnrollmentRepository extends BaseRepository {
    constructor(protected readonly db: DatabaseService) {
        super(db);
    }

    /* =======================
       FIND ACTIVE ENROLLMENT
    ======================= */
    async findActiveByStudentId(
        studentId: string,
        conn?: PoolConnection,
    ): Promise<EnrollmentRow | undefined> {
        const rows = await this.query<EnrollmentRow[]>(
            `SELECT *
       FROM enrollments
       WHERE student_id = ?
         AND deleted_at IS NULL
       ORDER BY academic_year DESC, created_at DESC
       LIMIT 1`,
            [studentId],
            conn,
        );

        return rows[0];
    }

    async findByStudentAndYear(
        studentId: string,
        academicYear: string,
        conn?: PoolConnection,
    ): Promise<EnrollmentRow | undefined> {
        const rows = await this.query<EnrollmentRow[]>(
            `SELECT *
       FROM enrollments
       WHERE student_id = ?
         AND academic_year = ?
         AND deleted_at IS NULL`,
            [studentId, academicYear],
            conn,
        );

        return rows[0];
    }

    /* =======================
       CREATE ENROLLMENT
    ======================= */
    async createEnrollment(
        data: {
            studentId: string;
            enrollmentNumber: string;
            standard: EnrollmentRow['standard'];
            academicYear: string;
            totalMonthlyFee: number;
            paymentStatus: EnrollmentRow['payment_status'];
            amountPaid: number | null;
            dueDate: Date | null;
        },
        conn?: PoolConnection,
    ): Promise<EnrollmentRow> {

        const id = crypto.randomUUID();
        console.log([
            id,
            data.enrollmentNumber,
            data.studentId,
            data.standard,
            data.totalMonthlyFee,
            data.paymentStatus,
            data.amountPaid,
            data.dueDate,
        ]);
        await this.execute(
            `INSERT INTO enrollments (
        id, enrollment_number, student_id,
        standard, academic_year, total_monthly_fee,
        payment_status, amount_paid, due_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                data.enrollmentNumber,
                data.studentId,
                data.standard,
                data.academicYear,
                data.totalMonthlyFee,
                data.paymentStatus,
                data.amountPaid ?? null,
                data.dueDate ?? null,
            ],
            conn,
        );

        const rows = await this.query<EnrollmentRow[]>(
            `SELECT *
       FROM enrollments
       WHERE id = ?`,
            [id],
            conn,
        );

        return rows[0];
    }

    /* =======================
       UPDATE TOTAL FEE
    ======================= */
    async updateTotalFee(
        enrollmentId: string,
        totalFee: number,
        conn?: PoolConnection,
    ): Promise<void> {
        await this.execute(
            `UPDATE enrollments
       SET total_monthly_fee = ?
       WHERE id = ?`,
            [totalFee, enrollmentId],
            conn,
        );
    }

    async updatePaymentInfo(
        enrollmentId: string,
        data: {
            paymentStatus?: string;
            amountPaid?: number | null;
            dueDate?: Date | null;
            totalMonthlyFee?: number;
        },
        conn?: PoolConnection,
    ): Promise<void> {
        const fields: string[] = [];
        const values: SqlParam[] = [];

        if (data.paymentStatus) {
            fields.push('payment_status = ?');
            values.push(data.paymentStatus);
        }

        if (data.amountPaid !== undefined) {
            fields.push('amount_paid = ?');
            values.push(data.amountPaid);
        }

        if (data.dueDate !== undefined) {
            fields.push('due_date = ?');
            values.push(data.dueDate);
        }

        if (data.totalMonthlyFee !== undefined) {
            fields.push('total_monthly_fee = ?');
            values.push(data.totalMonthlyFee);
        }

        if (fields.length === 0) return;

        values.push(enrollmentId);
        const sql = `UPDATE enrollments SET ${fields.join(', ')} WHERE id = ?`;
        console.log('Executing updatePaymentInfo SQL:', sql, 'with values:', values);
        await this.execute(sql, values, conn);
    }




    /* =======================
       CHECK DUPLICATE BATCH (CRITICAL)
    ======================= */
    async existsStudentBatch(
        studentId: string,
        batchId: string,
        conn?: PoolConnection,
    ): Promise<boolean> {
        const rows = await this.query<RowDataPacket[]>(
            `SELECT 1
       FROM enrollment_batches eb
       JOIN enrollments e ON e.id = eb.enrollment_id
       WHERE e.student_id = ?
         AND eb.batch_id = ?
         AND eb.left_at IS NULL
       LIMIT 1`,
            [studentId, batchId],
            conn,
        );

        return rows.length > 0;
    }

    /* =======================
       GENERATE ENROLLMENT NUMBER
    ======================= */
    async generateEnrollmentNumber(
        conn?: PoolConnection,
    ): Promise<string> {
        const year = new Date().getFullYear();

        const rows = await this.query<RowDataPacket[]>(
            `SELECT COUNT(*) as count
       FROM enrollments
       WHERE YEAR(created_at) = ?`,
            [year],
            conn,
        );

        const count = Number(rows[0].count) + 1;

        const padded = count.toString().padStart(3, '0');

        return `STU-${year}-${padded}`;
    }

    /* =======================
       SOFT DELETE (FUTURE USE)
    ======================= */
    async softDelete(
        enrollmentId: string,
        conn?: PoolConnection,
    ): Promise<ResultSetHeader> {
        return this.execute(
            `UPDATE enrollments
       SET deleted_at = NOW()
       WHERE id = ?`,
            [enrollmentId],
            conn,
        );
    }

    async findById(id: string, conn?: PoolConnection): Promise<EnrollmentRow | undefined> {
        const rows = await this.query<EnrollmentRow[]>(
            `SELECT * FROM enrollments WHERE id = ?`,
            [id],
            conn,
        );

        return rows[0];
    }

}