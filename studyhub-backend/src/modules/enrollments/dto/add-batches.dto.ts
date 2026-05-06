import { IsArray, ArrayNotEmpty, IsString, IsEnum, IsNumber, Min, IsOptional } from 'class-validator';
import { PaymentStatus } from 'src/common/enums/payment-status.enum';

export class AddBatchesDto {
    @IsArray({ message: 'Batch selection must be an array' })
    @ArrayNotEmpty({ message: 'Select at least one batch' })
    @IsString({ each: true, message: 'Invalid batch identifier detected' })
    batchIds!: string[];

    @IsEnum(PaymentStatus)
    paymentStatus!: PaymentStatus;

    @IsOptional()
    @IsNumber()
    @Min(0)
    amountPaid?: number;

    @IsOptional()
    @IsString()
    dueDate?: string;
}
