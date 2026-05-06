import type { Batch } from "../api/batches";

export type StudentBatch = Batch & {
    teacher_name?: string;
    joined_at?: string;
    left_at?: string | null;
};

export type Student = {
    id: string;
    name: string;
    parent_name?: string;  // from API
    parentName?: string;   // form field
    phone: string;
    email?: string | null;
    dob: string;
    address: string;
    enrollment_id?: string | null;
    enrollment_number?: string | null;
    standard?: string | null;
    payment_status?: 'PAID' | 'PARTIAL' | 'PENDING' | null;
    total_monthly_fee?: number | null;
    amount_paid?: number | null;
    due_date?: string | null;
    academic_year?: string | null;
    batch_count?: number;
    batches?: StudentBatch[];
    created_at?: string;
    updated_at?: string;
    createdAt?: string;
};
