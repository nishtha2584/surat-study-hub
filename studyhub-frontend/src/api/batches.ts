import { api } from "./axios";

/* =========================
   TYPES
========================= */

export type Batch = {
  id: string;
  code: string;
  subject: string;
  standard: string;
  teacherId: string;
  teacherName?: string;
  scheduleDays: string[] | string;
  timeSlot: string;
  totalSeats: number;
  occupiedSeats: number;
  availableSeats: number;
  monthlyFee: number;
  startDate: string;
  endDate: string;
  status: string;
};

export type CreateBatchPayload = {
  code: string;
  subject: string;
  standard: string;
  teacherId: string;
  scheduleDays: string[];
  timeSlot: string;
  totalSeats: number;
  monthlyFee: number;
  startDate: string;
  endDate: string;
  status?: string;
};

/* =========================
   GET ALL
========================= */

export const getBatches = async (
  params: {
    page?: number;
    limit?: number;
    search?: string;
    subject?: string;
    standard?: string;
    status?: string;
    teacherId?: string;
  } = {}
): Promise<{ items: Batch[]; total: number }> => {
  const res = await api.get("/batches", {
    params,
  });

  return res.data.data;
};


/* =========================
   GET BY ID
========================= */

export const getBatchById = async (id: string): Promise<Batch> => {
  const res = await api.get(`/batches/${id}`);
  return res.data.data;
};

/* =========================
   CREATE
========================= */

export const createBatch = async (
  payload: CreateBatchPayload
): Promise<{ id: string }> => {
  const res = await api.post("/batches", payload);
  return res.data.data;
};

/* =========================
   UPDATE
========================= */

export const updateBatch = async (
  id: string,
  payload: Partial<CreateBatchPayload>
): Promise<Batch> => {
  const res = await api.patch(`/batches/${id}`, payload);
  return res.data.data;
};

/* =========================
   DELETE
========================= */

export const deleteBatch = async (
  id: string
): Promise<{ id: string }> => {
  const res = await api.delete(`/batches/${id}`);
  return res.data.data;
};

/* =========================
   GET BATCH STUDENTS
========================= */

export type BatchStudent = {
  id: string;
  name: string;
  enrollment_number: string | null;
  attendance_percentage: number | null;
  last_attendance_status: string | null;
};

export const getBatchStudents = async (batchId: string): Promise<BatchStudent[]> => {
  const res = await api.get(`/batches/${batchId}/students`);
  return res.data.data;
};

/* =========================
   MARK ATTENDANCE
========================= */

export const markAttendance = async (
  batchId: string,
  studentId: string,
  date: string,
  status: "PRESENT" | "ABSENT" | "LATE",
  note?: string
): Promise<{ id: string }> => {
  const res = await api.post(`/batches/${batchId}/students/${studentId}/attendance`, {
    date,
    status,
    note,
  });
  return res.data.data;
};

/* =========================
   MARK BULK ATTENDANCE
========================= */

export type BulkAttendancePayload = {
  batchId: string;
  date: string;
  records: {
    studentId: string;
    status: "PRESENT" | "ABSENT" | "LATE";
    note?: string;
  }[];
};

export const markBulkAttendance = async (
  payload: BulkAttendancePayload
): Promise<{ sessionId: string; total: number }> => {
  const res = await api.post("/attendance/bulk", payload);
  return res.data.data;
};