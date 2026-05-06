import { RowDataPacket } from 'mysql2/promise';

export type CountRow = RowDataPacket & {
    count: number;
};

export type RevenueRow = RowDataPacket & {
    total: number | null;
};

export type AttendanceRow = RowDataPacket & {
    total: number;
    present: number | null;
};

export type RevenueTrendRow = RowDataPacket & {
    month: string;
    value: number | null;
};

export type RevenueByStandardRow = RowDataPacket & {
    name: string;
    value: number;
};

export type EnrollmentByStandardRow = RowDataPacket & {
    name: string;
    value: number;
};

export type RecentStudentRow = RowDataPacket & {
    id: string;
    name: string;
    standard: string | null;
    createdAt: Date;
};

export type DashboardResponse = {
    totalStudents: number;
    activeBatches: number;
    totalRevenue: number;
    attendancePercentage: number;
    revenueTrend: {
        month: string;
        value: number;
    }[];
    enrollmentsByStandard: {
        name: string;
        value: number;
    }[];
    revenueByStandard: {
        name: string;
        value: number;
    }[];
};

export type TeacherDashboardResponse = {
    totalBatchesAssigned: number;
    totalStudentsTeaching: number;
    attendancePercentage: number;
    batches: {
        id: string;
        code: string;
        subject: string;
        standard: string;
        totalStudents: number;
        attendancePercentage: number;
    }[];
};

export type ReceptionistDashboardResponse = {
    totalStudents: number;
    pendingPaymentsCount: number;
    activeBatchesCount: number;
    recentRegistrations: {
        id: string;
        name: string;
        standard: string | null;
        createdAt: Date;
    }[];
};