import { RowDataPacket } from 'mysql2/promise';
import { UserRole } from 'src/common/enums/user-role.enum';

/* =======================
   USER ROW (DB SHAPE)
======================= */

export type UserRow = RowDataPacket & {
    id: string;
    name: string;
    email: string;
    password: string; // needed internally for auth
    role: UserRole;
    is_locked: number; // MySQL boolean → number (0 / 1)
    created_at: Date;
    updated_at: Date;
};