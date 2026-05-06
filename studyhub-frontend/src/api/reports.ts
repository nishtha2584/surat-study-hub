import { api } from "./axios";

export interface DailyAdmissionRow {
    total_new_admissions: number;
    total_students_enrolled: number;
    total_fee_collected: number;
    total_pending_fees: number;
}

export interface TopBatchRow {
    code: string;
    subject: string;
    new_admissions: number;
}

export interface DailyReportResponse {
    summary: DailyAdmissionRow;
    topBatches: TopBatchRow[];
}

export interface BatchOccupancyRow {
    code: string;
    subject: string;
    standard: string;
    teacher_name: string;
    total_seats: number;
    occupied_seats: number;
    available_seats: number;
    occupancy_percentage: number;
}

export interface LowOccupancyRow {
    code: string;
    subject: string;
    teacher_name: string;
    occupied_seats: number;
    occupancy_percentage: number;
    available_seats: number;
    occupancy_status: string;
}

export interface FeePendingRow {
    student_name: string;
    enrollment_number: string;
    parent_name: string;
    parent_contact: string;
    enrolled_batches: string;
    total_monthly_fee: number;
    amount_paid: number;
    amount_pending: number;
    days_overdue: number | null;
}

export const getDailyAdmissionReport = async (date?: string): Promise<DailyReportResponse> => {
    const res = await api.get("/reports/daily-admissions", { params: { date } });
    return res.data.data;
};

export const getBatchOccupancyReport = async (): Promise<BatchOccupancyRow[]> => {
    const res = await api.get("/reports/batch-occupancy");
    return res.data.data;
};

export const getLowOccupancyAlert = async (): Promise<LowOccupancyRow[]> => {
    const res = await api.get("/reports/low-occupancy");
    return res.data.data;
};

export const getFeePendingReport = async (): Promise<FeePendingRow[]> => {
    const res = await api.get("/reports/fee-pending");
    return res.data.data;
};
