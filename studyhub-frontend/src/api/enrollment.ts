import { api } from "./axios";

export type EnrollmentPayload = {
    studentId: string;
    standard: string;
    academicYear: string;
    batchIds?: string[];
    paymentStatus: "PAID" | "PARTIAL" | "PENDING";
    amountPaid?: number;
    dueDate?: string;
};

export const createEnrollment = async (payload: EnrollmentPayload) => {
    const res = await api.post("/enrollments", payload);
    return res.data.data;
};

export const addBatches = async (enrollmentId: string, payload: { batchIds: string[], paymentStatus: string, amountPaid?: number, dueDate?: string }) => {
    const res = await api.post(`/enrollments/${enrollmentId}/batches`, payload);
    return res.data.data;
};

export const updateEnrollment = async (id: string, payload: Partial<EnrollmentPayload>) => {
    const res = await api.patch(`/enrollments/${id}`, payload);
    return res.data.data;
};

export const leaveBatch = async (enrollmentId: string, batchId: string) => {
    const res = await api.delete(`/enrollments/${enrollmentId}/batches/${batchId}`);
    return res.data;
};