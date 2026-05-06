

export type BatchStudent = {
    id: string;
    name: string;
    parent_name: string;
    phone: string;
    email: string | null;
    dob: string;
    address: string;
    enrollment_number: string;
    payment_status: 'PAID' | 'PENDING' | 'PARTIAL';
    total_monthly_fee: number;
    amount_paid?: number;
    attendance_percentage?: number;
    last_attendance_status?: string;
};
