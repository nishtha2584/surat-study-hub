import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getBatches } from "../api/batches";

type UseBatchesParams = {
  page?: number;
  limit?: number;
  search?: string;
  subject?: string;
  standard?: string;
  status?: string;
  teacherId?: string;
};

export const useBatches = (params?: UseBatchesParams) => {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const search = params?.search;
  const subject = params?.subject;
  const standard = params?.standard;
  const status = params?.status;
  const teacherId = params?.teacherId;

  return useQuery({
    queryKey: ["batches", { page, limit, search, subject, standard, status, teacherId }],
    queryFn: () => getBatches({ page, limit, search, subject, standard, status, teacherId }),


    // 🔥 UX improvements
    placeholderData: keepPreviousData, // smooth pagination
    staleTime: 1000 * 60 * 5, // 5 mins cache
    retry: 1,
  });
};