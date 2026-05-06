// hooks/useDashboard.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/axios';

export type AdminDashboardData = {
    totalStudents: number;
    activeBatches: number;
    totalRevenue: number;
    attendancePercentage: number;
    revenueTrend: { month: string; value: number }[];
    enrollmentsByStandard: { name: string; value: number }[];
    revenueByStandard: { name: string; value: number }[];
};

export type TeacherDashboardData = {
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

export type ReceptionistDashboardData = {
    totalStudents: number;
    pendingPaymentsCount: number;
    activeBatchesCount: number;
    recentRegistrations: {
        id: string;
        name: string;
        standard: string;
        createdAt: string;
    }[];
};

export type DashboardData = AdminDashboardData | TeacherDashboardData | ReceptionistDashboardData;


export const useDashboard = () => {
    return useQuery({
        queryKey: ['dashboard'],
        queryFn: async (): Promise<DashboardData> => {
            const res = await api.get('/dashboard');
            return res.data.data;
        },
    });
};