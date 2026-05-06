import { RowDataPacket } from "mysql2/promise";
import { AttendanceStatus } from "src/common/enums/attendance-status.enum";

export interface AttendanceRow extends RowDataPacket {
    id: string;
    student_id: string;
    session_id: string;
    status: AttendanceStatus;
    note: string | null;
    created_at: Date;
};
