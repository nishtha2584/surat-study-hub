import { Standard } from "src/common/enums/standard.enum";
import { PaymentStatus } from "src/common/enums/payment-status.enum";

export type EnrollDto = {
    studentId: string;
    batchIds: string[];
    standard: Standard;
    paymentStatus: PaymentStatus;
    amountPaid: number | null;
    dueDate: Date | null;
};