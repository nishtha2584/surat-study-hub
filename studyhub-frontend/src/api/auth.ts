import { api } from "./axios";
import type { UserRole } from "../stores/useAuthStore";

/* =========================
   TYPES
========================= */

export type LoginPayload = {
    email: string;
    password: string;
};

export type User = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
};

export type LoginResponse = {
    accessToken: string;
    refreshToken: string;
    user: User;
};

/* =========================
   LOGIN
========================= */

export const login = async (
    payload: LoginPayload
): Promise<LoginResponse> => {
    const res = await api.post("/auth/login", payload);
    return res.data.data;
};

/* =========================
   GET ME
========================= */

export const getMe = async (): Promise<User> => {
    const res = await api.get("/auth/me");
    return res.data.data;
};