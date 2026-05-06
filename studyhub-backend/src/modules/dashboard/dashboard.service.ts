import { Injectable } from '@nestjs/common';
import { DashboardRepository } from './dashboard.repository';

import { DashboardResponse, TeacherDashboardResponse, ReceptionistDashboardResponse } from './types/dashboard.types';

@Injectable()
export class DashboardService {
    constructor(private readonly repo: DashboardRepository) { }

    async getDashboard(): Promise<DashboardResponse> {
        const [
            totalStudents,
            activeBatches,
            totalRevenue,
            attendance,
            revenueTrend,
            enrollmentsByStandard,
            revenueByStandard,
        ] = await Promise.all([
            this.repo.getTotalStudents(),
            this.repo.getActiveBatches(),
            this.repo.getTotalRevenue(),
            this.repo.getAttendanceStats(),
            this.repo.getRevenueTrend(),
            this.repo.getEnrollmentsByStandard(),
            this.repo.getRevenueByStandard(),
        ]);

        const attendancePercentage =
            attendance.total === 0
                ? 0
                : Math.round(
                    ((attendance.present ?? 0) / attendance.total) * 100,
                );

        const ALL_STANDARDS = ['EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE'];

        // Ensure all standards exist in Enrollments distribution
        const formattedEnrollments = ALL_STANDARDS.map(std => {
            const row = enrollmentsByStandard.find(r => r.name === std);
            return { name: std, value: row ? Number(row.value) : 0 };
        });

        // Ensure all standards exist in Revenue distribution
        const formattedRevenue = ALL_STANDARDS.map(std => {
            const row = revenueByStandard.find(r => r.name === std);
            return { name: std, value: row ? Number(row.value) : 0 };
        });

        return {
            totalStudents,
            activeBatches,
            totalRevenue,
            attendancePercentage,
            revenueTrend: revenueTrend.map((r) => ({
                month: r.month,
                value: r.value ?? 0,
            })),
            enrollmentsByStandard: formattedEnrollments,
            revenueByStandard: formattedRevenue,
        };
    }

    async getTeacherDashboard(teacherId: string): Promise<TeacherDashboardResponse> {
        const [
            totalBatchesAssigned,
            totalStudentsTeaching,
            attendancePercentage,
            batches,
        ] = await Promise.all([
            this.repo.getTeacherBatchesAssigned(teacherId),
            this.repo.getTeacherTotalStudents(teacherId),
            this.repo.getTeacherAttendancePercentage(teacherId),
            this.repo.getTeacherBatchesWithDetails(teacherId),
        ]);

        return {
            totalBatchesAssigned,
            totalStudentsTeaching,
            attendancePercentage,
            batches,
        };
    }

    async getReceptionistDashboard(): Promise<ReceptionistDashboardResponse> {
        const [
            totalStudents,
            pendingPaymentsCount,
            activeBatchesCount,
            recentRegistrations,
        ] = await Promise.all([
            this.repo.getTotalStudents(),
            this.repo.getPendingPaymentsCount(),
            this.repo.getActiveBatches(),
            this.repo.getRecentStudents(5),
        ]);

        return {
            totalStudents,
            pendingPaymentsCount,
            activeBatchesCount,
            recentRegistrations,
        };
    }
}