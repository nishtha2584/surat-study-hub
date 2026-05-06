import { RowDataPacket } from 'mysql2/promise';
import { PaymentStatus } from 'src/common/enums/payment-status.enum';
import { Standard } from 'src/common/enums/standard.enum';

export type EnrollmentRow = RowDataPacket & {
    id: string;
    enrollment_number: string;
    student_id: string;
    standard: Standard;
    total_monthly_fee: number;
    payment_status: PaymentStatus;
    amount_paid: number | null;
    due_date: Date | null;
    academic_year: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
};
