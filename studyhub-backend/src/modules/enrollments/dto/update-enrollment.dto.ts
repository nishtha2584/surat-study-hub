import { Type } from 'class-transformer';
import {
    IsEnum,
    IsOptional,
    IsNumber,
    Min,
    IsDate,
} from 'class-validator';
import { PaymentStatus } from 'src/common/enums/payment-status.enum';

export class UpdateEnrollmentDto {
    @IsOptional()
    @IsEnum(PaymentStatus, { message: 'Status must be PAID, PARTIAL, or PENDING' })
    paymentStatus?: PaymentStatus;

    @IsOptional()
    @IsNumber({}, { message: 'Collected amount must be a number' })
    @Min(0, { message: 'Collected amount cannot be negative' })
    @Type(() => Number)
    amountPaid?: number;

    @IsOptional()
    @IsDate({ message: 'Please provide a valid date' })
    @Type(() => Date)
    dueDate?: Date;
}
