import { Type } from 'class-transformer';
import {
    IsUUID,
    IsArray,
    ArrayNotEmpty,
    IsEnum,
    IsOptional,
    IsNumber,
    Min,
    IsDate,
    IsNotEmpty,
    Matches,
} from 'class-validator';

import { PaymentStatus } from 'src/common/enums/payment-status.enum';
import { Standard } from 'src/common/enums/standard.enum';

export class CreateEnrollmentDto {
    @IsUUID('all', { message: 'Please provide a valid student identifier' })
    @IsNotEmpty({ message: 'Student ID is required' })
    studentId!: string;

    @IsOptional()
    @IsArray({ message: 'At least one batch must be selected' })
    @IsUUID('all', { each: true, message: 'Invalid batch identifier detected' })
    batchIds?: string[];

    @IsNotEmpty({ message: 'Academic year is required' })
    @Matches(/^[0-9]{4}-[0-9]{4}$/, { message: 'Academic year must be in YYYY-YYYY format (e.g., 2024-2025)' })
    academicYear!: string;

    @IsEnum(Standard, { message: 'Invalid academic standard provided' })
    @IsNotEmpty({ message: 'Standard is required' })
    standard!: Standard;

    @IsEnum(PaymentStatus, { message: 'Status must be PAID, PARTIAL, or PENDING' })
    @IsNotEmpty({ message: 'Payment status is required' })
    paymentStatus!: PaymentStatus;

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