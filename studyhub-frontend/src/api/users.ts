import { api } from "./axios";
import type { User, UserRole } from "../types/User";

export type CreateUserPayload = {
    name: string;
    email: string;
    role?: UserRole;
    password?: string;
};

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, 'password'>>;

export const getUsers = async (role?: string): Promise<User[]> => {
    const res = await api.get("/users", {
        params: { role },
    });
    return res.data.data;
};

export const getUserById = async (id: string): Promise<User> => {
    const res = await api.get(`/users/${id}`);
    return res.data.data;
};

export const createUser = async (payload: CreateUserPayload): Promise<User> => {
    const res = await api.post("/users", payload);
    return res.data.data;
};

export const updateUserAdmin = async (id: string, payload: UpdateUserPayload): Promise<User> => {
    const res = await api.patch(`/users/${id}`, payload);
    return res.data.data;
};

export const deleteUser = async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
};

export const lockUser = async (id: string): Promise<void> => {
    await api.patch(`/users/${id}/lock`);
};

export const unlockUser = async (id: string): Promise<void> => {
    await api.patch(`/users/${id}/unlock`);
};

export const resetPassword = async (id: string, payload: { newPassword: string }): Promise<void> => {
    await api.patch(`/users/${id}/reset-password`, payload);
};

export const updateProfile = async (payload: { name: string; email: string }): Promise<User> => {
    const res = await api.patch("/users/profile", payload);
    return res.data.data;
};
