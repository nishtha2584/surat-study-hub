import { api } from "./axios";

export const markTeacherAttendance = async (payload: {
  batchId: string;
  date: string;
  status: "PRESENT" | "ABSENT";
}): Promise<{ status: "PRESENT" | "ABSENT" | "CANCELLED"; substituteId?: string; message: string }> => {
  const res = await api.post("/attendance/teacher", payload);
  return res.data.data;
};
