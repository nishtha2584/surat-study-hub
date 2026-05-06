import { api } from "./axios";
import type { Student } from "../types/Student";




export type CreateStudentPayload = {
    name: string;
    parentName: string;
    phone: string;
    email?: string;
    dob: string;
    address: string;
};

/* =========================
   GET ALL
========================= */

export const getStudents = async (
    page = 1,
    limit = 10,
    search?: string,
    paymentStatus?: string,
): Promise<{ items: Student[]; total: number }> => {
    const res = await api.get("/students", {
        params: { page, limit, search, paymentStatus },
    });
    return res.data.data;
};


/* =========================
   CREATE
========================= */

export const createStudent = async (
    payload: CreateStudentPayload
): Promise<Student> => {
    const res = await api.post("/students", payload);
    return res.data.data;
};

/* =========================
   GET BY ID
========================= */

export const getStudentById = async (id: string): Promise<Student> => {
    const res = await api.get(`/students/${id}`);
    return res.data.data;
};

/* =========================
   UPDATE
========================= */

export const updateStudent = async (
    id: string,
    payload: Partial<CreateStudentPayload>
): Promise<Student> => {
    const res = await api.patch(`/students/${id}`, payload);
    return res.data.data;
};

