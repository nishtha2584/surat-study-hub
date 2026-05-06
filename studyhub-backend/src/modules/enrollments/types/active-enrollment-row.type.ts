import { RowDataPacket } from "mysql2/promise";

export type ActiveEnrollmentRow = RowDataPacket & {
    id: string;
};