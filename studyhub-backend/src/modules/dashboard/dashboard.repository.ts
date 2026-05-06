import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { DatabaseService } from 'src/common/database/database.service';
import { RowDataPacket } from 'mysql2/promise';

import {
    CountRow,
    RevenueRow,
    AttendanceRow,
    RevenueTrendRow,
    RevenueByStandardRow,
    EnrollmentByStandardRow,
    RecentStudentRow,
} from './types/dashboard.types';

export type TeacherBatchRow = RowDataPacket & {
    id: string;
    code: string;
    subject: string;
    standard: string;
    totalStudents: number;
    attendancePercentage: number;
};

@Injectable()
export class DashboardRepository extends BaseRepository {
    constructor(protected readonly db: DatabaseService) {
        super(db);
    }

    async getTotalStudents(): Promise<number> {
        const rows = await this.query<CountRow[]>(
            `SELECT COUNT(*) as count FROM students WHERE deleted_at IS NULL`
        );

        return rows[0]?.count ?? 0;
    }

    async getActiveBatches(): Promise<number> {
        const rows = await this.query<CountRow[]>(
            `SELECT COUNT(*) as count 
       FROM batches 
       WHERE status = 'ACTIVE' AND deleted_at IS NULL`
        );

        return rows[0]?.count ?? 0;
    }

    async getTotalRevenue(): Promise<number> {
        const rows = await this.query<RevenueRow[]>(
            `SELECT SUM(amount_paid) as total 
       FROM enrollments 
       WHERE payment_status IN ('PAID','PARTIAL') 
       AND deleted_at IS NULL`
        );

        return rows[0]?.total ?? 0;
    }

    async getAttendanceStats(): Promise<AttendanceRow> {
        const rows = await this.query<AttendanceRow[]>(
            `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN status='PRESENT' THEN 1 ELSE 0 END) as present
       FROM attendance`
        );

        return rows[0];
    }

    async getRevenueTrend(): Promise<RevenueTrendRow[]> {
        return this.query<RevenueTrendRow[]>(
            `SELECT 
         DATE_FORMAT(created_at, '%b') as month,
         SUM(amount_paid) as value
       FROM enrollments
       WHERE amount_paid IS NOT NULL
       GROUP BY month
       ORDER BY MIN(created_at)`
        );
    }

    async getEnrollmentsByStandard(): Promise<EnrollmentByStandardRow[]> {
        return this.query<EnrollmentByStandardRow[]>(
            `SELECT 
         standard as name,
         COUNT(*) as value
       FROM enrollments
       WHERE deleted_at IS NULL
       GROUP BY standard`
        );
    }

    async getRevenueByStandard(): Promise<RevenueByStandardRow[]> {
        return this.query<RevenueByStandardRow[]>(
            `SELECT 
         standard as name,
         SUM(COALESCE(amount_paid, 0)) as value
       FROM enrollments
       WHERE deleted_at IS NULL
         AND payment_status IN ('PAID', 'PARTIAL')
       GROUP BY standard`
        );
    }

    // Teacher-specific methods
    async getTeacherBatchesAssigned(teacherId: string): Promise<number> {
        const rows = await this.query<CountRow[]>(
            `SELECT COUNT(*) as count 
       FROM batches 
       WHERE teacher_id = ? AND status = 'ACTIVE' AND deleted_at IS NULL`,
            [teacherId]
        );

        return rows[0]?.count ?? 0;
    }

    async getTeacherTotalStudents(teacherId: string): Promise<number> {
        const rows = await this.query<CountRow[]>(
            `SELECT COUNT(DISTINCT eb.enrollment_id) as count
       FROM enrollment_batches eb
       JOIN batches b ON b.id = eb.batch_id
       WHERE b.teacher_id = ? AND b.status = 'ACTIVE' AND b.deleted_at IS NULL
       AND eb.left_at IS NULL`,
            [teacherId]
        );

        return rows[0]?.count ?? 0;
    }

    async getTeacherAttendancePercentage(teacherId: string): Promise<number> {
        const rows = await this.query<AttendanceRow[]>(
            `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN a.status='PRESENT' THEN 1 ELSE 0 END) as present
       FROM attendance a
       JOIN class_sessions cs ON cs.id = a.session_id
       JOIN batches b ON b.id = cs.batch_id
       WHERE b.teacher_id = ? AND b.status = 'ACTIVE' AND b.deleted_at IS NULL`,
            [teacherId]
        );

        const attendance = rows[0];
        if (!attendance || attendance.total === 0) return 0;

        return Math.round(((attendance.present ?? 0) / attendance.total) * 100);
    }

    async getTeacherBatchesWithDetails(teacherId: string): Promise<TeacherBatchRow[]> {
        return this.query<TeacherBatchRow[]>(
            `SELECT 
         b.id,
         b.code,
         b.subject,
         b.standard,
         COUNT(DISTINCT eb.enrollment_id) as totalStudents,
         COALESCE(
           ROUND(
             (SUM(CASE WHEN a.status='PRESENT' THEN 1 ELSE 0 END) / COUNT(*)) * 100
           ), 0
         ) as attendancePercentage
       FROM batches b
       LEFT JOIN class_sessions cs ON cs.batch_id = b.id
       LEFT JOIN attendance a ON a.session_id = cs.id
       LEFT JOIN enrollment_batches eb ON eb.batch_id = b.id AND eb.left_at IS NULL
       WHERE b.teacher_id = ? AND b.status = 'ACTIVE' AND b.deleted_at IS NULL
       GROUP BY b.id, b.code, b.subject, b.standard`,
            [teacherId]
        );
    }

    // Receptionist-specific methods
    async getPendingPaymentsCount(): Promise<number> {
        const rows = await this.query<CountRow[]>(
            `SELECT COUNT(*) as count 
       FROM enrollments 
       WHERE payment_status IN ('PENDING', 'PARTIAL') 
       AND deleted_at IS NULL`
        );
        return rows[0]?.count ?? 0;
    }

    async getRecentStudents(limit: number): Promise<RecentStudentRow[]> {
        return this.query<RecentStudentRow[]>(
            `SELECT s.id, s.name, e.standard, s.created_at as createdAt
       FROM students s
       LEFT JOIN enrollments e ON e.student_id = s.id
       WHERE s.deleted_at IS NULL 
       ORDER BY s.created_at DESC 
       LIMIT ?`,
            [limit]
        );
    }
}