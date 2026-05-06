export type BatchStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type Batch = {
    id: string;
    code: string;
    subject: string;
    standard: string;
    teacherId: string;
    teacherName?: string;
    scheduleDays: string[];
    timeSlot: string;
    totalSeats: number;
    occupiedSeats: number;
    availableSeats: number;
    monthlyFee?: number;
    startDate: string;
    endDate: string;
    status: BatchStatus;
    createdAt?: string;
};
