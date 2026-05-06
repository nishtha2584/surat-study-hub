import { RowDataPacket } from 'mysql2/promise';

export type EnrollmentBatchRow = RowDataPacket & {
    id: string;
    enrollment_id: string;
    batch_id: string;
    joined_at: Date;
    left_at: Date | null;
    is_active: number; // MySQL boolean → 0/1
};