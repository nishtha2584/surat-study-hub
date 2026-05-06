import {
    Injectable,
    ConflictException,
    NotFoundException,
    UnprocessableEntityException,
    BadRequestException,
} from '@nestjs/common';

import { DatabaseService } from 'src/common/database/database.service';

import { EnrollmentRepository } from './enrollments.repository';
import { BatchesRepository } from '../batches/batches.repository';
import { EnrollmentBatchRepository } from './enrollment-batch.repository';

import { EnrollmentRow } from './types/enroll-row.type';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { AddBatchesDto } from './dto/add-batches.dto';
import { PaymentStatus } from 'src/common/enums/payment-status.enum';

@Injectable()
export class EnrollmentService {
    constructor(
        private readonly db: DatabaseService,
        private readonly enrollmentRepo: EnrollmentRepository,
        private readonly batchRepo: BatchesRepository,
        private readonly enrollmentBatchRepo: EnrollmentBatchRepository,
    ) { }

    /* =======================
       CORE ENROLLMENT FLOW
    ======================= */
    /* =======================
       CORE ENROLLMENT FLOW
    ======================= */
    async enrollStudent(dto: CreateEnrollmentDto): Promise<EnrollmentRow> {
        return this.db.transaction(async (conn) => {
            // 1. CHECK FOR DUPLICATE YEAR
            const existing = await this.enrollmentRepo.findByStudentAndYear(
                dto.studentId,
                dto.academicYear,
                conn,
            );
            if (existing) {
                throw new ConflictException(
                    `Student already has an enrollment for year ${dto.academicYear}`,
                );
            }

            // 2. CREATE ADMISSION RECORD
            const enrollmentNumber = await this.enrollmentRepo.generateEnrollmentNumber(conn);
            
            // Monthly fee starts at 0 for mere admission
            const enrollment = await this.enrollmentRepo.createEnrollment(
                {
                    studentId: dto.studentId,
                    enrollmentNumber,
                    standard: dto.standard,
                    academicYear: dto.academicYear,
                    totalMonthlyFee: 0,
                    paymentStatus: dto.paymentStatus || PaymentStatus.PENDING,
                    amountPaid: dto.amountPaid || null,
                    dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
                },
                conn,
            );

            // 3. AUTO-ASSIGN BATCHES IF PROVIDED
            if (dto.batchIds && dto.batchIds.length > 0) {
                return this.addBatchesInternal(enrollment.id, {
                    batchIds: dto.batchIds,
                    paymentStatus: dto.paymentStatus as any,
                    amountPaid: dto.amountPaid,
                    dueDate: dto.dueDate ? new Date(dto.dueDate).toISOString() : undefined
                }, conn);
            }

            return enrollment;
        });
    }

    async addBatches(enrollmentId: string, dto: AddBatchesDto): Promise<EnrollmentRow> {
        return this.db.transaction(async (conn) => {
            return this.addBatchesInternal(enrollmentId, dto, conn);
        });
    }

    private async addBatchesInternal(
        id: string,
        dto: AddBatchesDto,
        conn: any,
    ): Promise<EnrollmentRow> {
        const enrollment = await this.enrollmentRepo.findById(id, conn);
        if (!enrollment) throw new NotFoundException('Enrollment record missing');

        const batches = await this.batchRepo.findByIds(dto.batchIds, conn);
        if (batches.length !== dto.batchIds.length) {
            throw new NotFoundException('One or more selected batches do not exist');
        }

        // VALIDATION: Standard must match
        for (const batch of batches) {
            if (batch.standard !== enrollment.standard) {
                throw new BadRequestException(
                    `Batch ${batch.code} serves ${batch.standard}, but student is enrolled for ${enrollment.standard}`,
                );
            }

            // VALIDATION: Already in batch
            const exists = await this.enrollmentRepo.existsStudentBatch(
                enrollment.student_id,
                batch.id,
                conn,
            );
            if (exists) {
                throw new ConflictException(`Already enrolled in batch ${batch.code}`);
            }
        }

        // UPDATE FEE & SEATS
        const addedFee = batches.reduce((sum, b) => sum + Number(b.monthly_fee), 0);
        const newTotalFee = Number(enrollment.total_monthly_fee) + addedFee;

        // Dedict seats
        for (const batch of batches) {
            const dec = await this.batchRepo.decrementSeat(batch.id, conn);
            if (dec.affectedRows === 0) {
                throw new ConflictException(`Batch ${batch.code} has no available seats`);
            }
            // Link
            await this.enrollmentBatchRepo.create(
                { enrollmentId: enrollment.id, batchId: batch.id },
                conn,
            );
        }

        // Update payment info using provided DTO details
        this.validatePayment(dto, newTotalFee);
        await this.enrollmentRepo.updatePaymentInfo(enrollment.id, {
            totalMonthlyFee: newTotalFee,
            paymentStatus: dto.paymentStatus,
            amountPaid: dto.amountPaid,
            dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        }, conn);

        return this.enrollmentRepo.findById(enrollment.id, conn) as Promise<EnrollmentRow>;
    }

    /* =======================
       PAYMENT VALIDATION
    ======================= */
    private validatePayment(
        dto: { paymentStatus: string; amountPaid?: number; dueDate?: string },
        totalFee: number,
    ): void {
        if (dto.paymentStatus === 'PAID') {
            if (dto.amountPaid !== totalFee) {
                throw new BadRequestException(
                    'Full payment required for PAID status',
                );
            }
        }

        if (dto.paymentStatus === 'PARTIAL') {
            if (!dto.amountPaid || dto.amountPaid >= totalFee) {
                throw new BadRequestException(
                    'Partial payment must be less than total fee',
                );
            }

            if (!dto.dueDate) {
                throw new BadRequestException(
                    'Due date required for partial payment',
                );
            }
        }

        if (dto.paymentStatus === 'PENDING') {
            if (dto.amountPaid) {
                throw new BadRequestException(
                    'No amount should be paid for pending status',
                );
            }

            if (!dto.dueDate) {
                throw new BadRequestException(
                    'Due date required for pending payment',
                );
            }
        }
    }

    async getActiveEnrollment(studentId: string): Promise<EnrollmentRow> {
        const enrollment = await this.enrollmentRepo.findActiveByStudentId(studentId);

        if (!enrollment) {
            throw new NotFoundException('Active enrollment not found');
        }

        return enrollment;
    }

    async getEnrollmentById(id: string): Promise<EnrollmentRow> {
        const enrollment = await this.enrollmentRepo.findById(id);

        if (!enrollment) {
            throw new NotFoundException('Enrollment not found');
        }

        return enrollment;
    }

    async updatePayment(id: string, dto: UpdateEnrollmentDto): Promise<EnrollmentRow> {
        console.log('Update payment request:', { id, dto });
        const enrollment = await this.enrollmentRepo.findById(id);

        if (!enrollment) {
            console.error('Enrollment not found for update:', id);
            throw new NotFoundException('Enrollment not found');
        }

        const totalFee = Number(enrollment.total_monthly_fee);
        let finalStatus = dto.paymentStatus || enrollment.payment_status;
        let finalAmount: number | null = dto.amountPaid !== undefined ? dto.amountPaid : (enrollment.amount_paid ? Number(enrollment.amount_paid) : null);
        let finalDueDate: Date | null | undefined = dto.dueDate;

        // Force logic based on constraints
        if (finalStatus === 'PAID') {
            finalAmount = totalFee;
            finalDueDate = null; // Clear due date for PAID
        } else if (finalStatus === 'PENDING') {
            finalAmount = null; // Clear amount for PENDING
            // dueDate must be provided or exist
            if (!finalDueDate && !enrollment.due_date) {
                throw new BadRequestException('Due date is required for PENDING status');
            }
        } else if (finalStatus === 'PARTIAL') {
            if (finalAmount !== null && finalAmount >= totalFee) {
                throw new BadRequestException('Partial payment must be less than total fee');
            }
            if (!finalDueDate && !enrollment.due_date) {
                throw new BadRequestException('Due date is required for PARTIAL status');
            }
        }

        try {
            await this.enrollmentRepo.updatePaymentInfo(id, {
                paymentStatus: finalStatus,
                amountPaid: finalAmount,
                dueDate: finalDueDate === null ? null : (finalDueDate ? finalDueDate : undefined),
            });

            return this.enrollmentRepo.findById(id) as Promise<EnrollmentRow>;
        } catch (error) {
            console.error('Error in updatePaymentInfo:', error);
            throw error;
        }
    }


    async leaveBatch(enrollmentId: string, batchId: string): Promise<void> {
        return this.db.transaction(async (conn) => {
            // 1. Check if enrollment exists and find the batch
            const enrollment = await this.enrollmentRepo.findById(enrollmentId, conn);
            if (!enrollment) throw new NotFoundException('Enrollment not found');

            const batches = await this.enrollmentBatchRepo.findBatchesWithDetailsByEnrollmentId(enrollmentId, conn);
            const batchToLeave = batches.find(b => b.id === batchId);

            if (!batchToLeave) {
                throw new NotFoundException('Student is not enrolled in this batch');
            }

            // 2. Mark as left in enrollment_batches
            await this.enrollmentBatchRepo.leaveBatch(enrollmentId, batchId, conn);

            // 3. Increment seat in batches table
            await this.batchRepo.incrementSeat(batchId, conn);

            // 4. Update enrollment total fee
            const newTotalFee = Math.max(0, Number(enrollment.total_monthly_fee) - Number(batchToLeave.monthly_fee));
            
            // Re-evaluate payment status if they already paid more than new total
            let newStatus = enrollment.payment_status;
            let newAmountPaid = enrollment.amount_paid ? Number(enrollment.amount_paid) : 0;

            if (newAmountPaid >= newTotalFee && newTotalFee > 0) {
                newStatus = PaymentStatus.PAID;
                newAmountPaid = newTotalFee; // Cap it? Or keep as credit? Cap for now.
            } else if (newTotalFee === 0) {
                newStatus = PaymentStatus.PENDING;
                newAmountPaid = 0;
            }

            await this.enrollmentRepo.updatePaymentInfo(enrollmentId, {
                totalMonthlyFee: newTotalFee,
                paymentStatus: newStatus,
                amountPaid: newAmountPaid,
            }, conn);
        });
    }
}