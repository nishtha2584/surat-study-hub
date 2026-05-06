import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';

import { StudentsRepository } from './students.repository';
import { StudentRow } from './students.repository';
import { EnrollmentBatchRepository } from '../enrollments/enrollment-batch.repository';

type StudentBatchResponse = {
    id: string;
    code: string;
    subject: string;
    standard: string;
    teacherId: string | null;
    teacherName: string;
    scheduleDays: string[];
    timeSlot: string;
    totalSeats: number;
    occupiedSeats: number;
    availableSeats: number;
    monthlyFee: number;
    startDate: string;
    endDate: string;
    status: string;
    teacher_name: string;
    joined_at: string;
    left_at: string | null;
};

type StudentResponse = StudentRow & {
    batches: StudentBatchResponse[];
};
import { BatchRow } from '../batches/types/batch-row.type';


import { ApiResponse } from 'src/common/types/api-response.type';
import { SqlParam } from 'src/common/types/sql-param.type';
import * as crypto from 'crypto';

interface MySqlError extends Error {
    code: string;
}

@Injectable()
export class StudentsService {
    constructor(
        private readonly repo: StudentsRepository,
        private readonly enrollmentBatchRepo: EnrollmentBatchRepository,
    ) { }

    /* =======================
       CREATE STUDENT
    ======================= */
    async createStudent(
        dto: {
            name: string;
            parentName: string;
            phone: string;
            email?: string | null;
            dob: string;
            address: string;
        },
    ): Promise<StudentRow> {
        try {
            return await this.repo.create({
                name: dto.name,
                parent_name: dto.parentName,
                phone: dto.phone,
                email: dto.email,
                dob: dto.dob,
                address: dto.address,
            });
        } catch (error: unknown) {
            if (error instanceof Error && (error as MySqlError).code === 'ER_DUP_ENTRY') {
                throw new ConflictException(
                    'Student with same details already exists',
                );
            }
            throw error;
        }
    }


    /* =======================
       GET ALL (PAGINATION)
    ======================= */
    async getAll(
        page: number,
        limit: number,
        search?: string,
        paymentStatus?: string,
    ): Promise<{ items: StudentRow[]; total: number }> {
        const offset = (page - 1) * limit;

        const [items, total] = await Promise.all([
            this.repo.findAll({ offset, limit, search, paymentStatus }),
            this.repo.countAll({ search, paymentStatus }),
        ]);

        return { items, total };
    }


    /* =======================
       GET BY ID
    ======================= */
    async getStudentById(id: string): Promise<StudentResponse> {
        const student = await this.repo.findById(id);

        if (!student) {
            throw new NotFoundException('Student not found');
        }

        let batches: (BatchRow & { teacher_name: string; joined_at: Date; left_at: Date | null })[] = [];
        if (student.enrollment_id) {
            batches = await this.enrollmentBatchRepo.findBatchesWithDetailsByEnrollmentId(
                student.enrollment_id,
            );
        }

        // Transform batches to match frontend expectations
        const transformedBatches = batches.map(batch => {
            let scheduleDays: string[] = [];
            
            const rawDays = batch.schedule_days;
            if (rawDays) {
                if (Array.isArray(rawDays)) {
                    scheduleDays = rawDays;
                } else if (typeof rawDays === 'string') {
                    try {
                        if (rawDays.startsWith('[')) {
                            scheduleDays = JSON.parse(rawDays);
                        } else {
                            scheduleDays = rawDays.split(',').map(d => d.trim()).filter(Boolean);
                        }
                    } catch {
                        scheduleDays = rawDays.split(',').map(d => d.trim()).filter(Boolean);
                    }
                }
            }

            return {
                id: batch.id,
                code: batch.code,
                subject: batch.subject,
                standard: batch.standard,
                teacherId: batch.teacher_id,
                teacherName: batch.teacher_name,
                scheduleDays,
                timeSlot: batch.time_slot,
                totalSeats: batch.total_seats,
                occupiedSeats: batch.occupied_seats,
                availableSeats: batch.available_seats,
                monthlyFee: batch.monthly_fee,
                startDate: batch.start_date.toISOString().split('T')[0],
                endDate: batch.end_date.toISOString().split('T')[0],
                status: batch.status,
                teacher_name: batch.teacher_name,
                joined_at: batch.joined_at.toISOString(),
                left_at: batch.left_at?.toISOString() || null,
            };
        });

        return {
            ...student,
            batches: transformedBatches,
        };
    }

    /* =======================
       SEARCH STUDENTS
    ======================= */
    async searchStudents(query: string): Promise<StudentRow[]> {
        if (!query || query.trim() === '') {
            throw new BadRequestException('Search query is required');
        }

        return this.repo.search(query);
    }

    /* =======================
       UPDATE STUDENT
    ======================= */
    async updateStudent(
        id: string,
        dto: {
            name?: string;
            parentName?: string;
            phone?: string;
            email?: string;
            dob?: string;
            address?: string;
        },
    ): Promise<StudentRow> {
        const existing = await this.repo.findById(id);

        if (!existing) {
            throw new NotFoundException('Student not found');
        }

        const fields: Record<string, SqlParam> = {};

        if (dto.name !== undefined) fields.name = dto.name;
        if (dto.parentName !== undefined) fields.parent_name = dto.parentName;
        if (dto.phone !== undefined) fields.phone = dto.phone;
        if (dto.email !== undefined) fields.email = dto.email;
        if (dto.dob !== undefined) fields.dob = dto.dob;
        if (dto.address !== undefined) fields.address = dto.address;

        if (Object.keys(fields).length === 0) {
            throw new BadRequestException('No fields provided');
        }


        await this.repo.update(id, fields);

        // 🔥 RETURN UPDATED ROW
        const updated = await this.repo.findById(id);

        if (!updated) {
            throw new NotFoundException('Student not found after update');
        }

        return updated;
    }

    /* =======================
       DELETE STUDENT (SOFT)
    ======================= */
    async deleteStudent(id: string): Promise<void> {
        const existing = await this.repo.findById(id);

        if (!existing) {
            throw new NotFoundException('Student not found');
        }

        await this.repo.softDelete(id);
    }

    /* =======================
       CHECK EXISTS (UTILITY)
    ======================= */
    async exists(id: string): Promise<boolean> {
        return this.repo.exists(id);
    }
}