import { UserRole } from "src/common/enums/user-role.enum";

export type UserResponse = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    is_locked: number;
    created_at?: Date;
};