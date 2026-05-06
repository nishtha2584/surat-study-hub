import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';

import { DatabaseService } from 'src/common/database/database.service';

import { AttendanceRepository } from './attendance.repository';
import { ClassSessionsService } from '../class_sessions/class_sessions.service';
import { BatchesRepository } from '../batches/batches.repository';

import { AttendanceRow } from './types/attendance-row.type';
import { PoolConnection } from 'mysql2/promise';
import { UsersRepository } from '../users/users.repository';
import { ClassSessionsRepository } from '../class_sessions/class-sessions.repository';
import { AttendanceStatus } from 'src/common/enums/attendance-status.enum';
import { StudentsRepository } from '../students/students.repository';

type MarkAttendanceDto = {
    batchId: string;
    studentId: string;
    date: string;
    status: AttendanceStatus;
    note?: string;
};

type BulkAttendanceDto = {
    batchId: string;
    date: string;
    records: {
        studentId: string;
        status: AttendanceStatus;
        note?: string;
    }[];
};

type BulkAttendanceResult = {
    sessionId: string;
    total: number;
};

@Injectable()
export class AttendanceService {
    constructor(
        private readonly db: DatabaseService,
        private readonly attendanceRepo: AttendanceRepository,
        private readonly sessionService: ClassSessionsService,
        private readonly sessionRepo: ClassSessionsRepository,
        private readonly batchRepo: BatchesRepository,
        private readonly userRepo: UsersRepository,
        private readonly studentsRepo: StudentsRepository,
    ) { }

    /* =======================
       MARK SINGLE ATTENDANCE
    ======================= */
    async markAttendance(dto: MarkAttendanceDto): Promise<AttendanceRow> {
        return this.db.transaction<AttendanceRow>(async (conn) => {
            // ── Validate student exists ──────────────────────────────────
            const studentExists = await this.studentsRepo.exists(dto.studentId, conn);
            if (!studentExists) {
                throw new BadRequestException(
                    `Student with ID "${dto.studentId}" does not exist or has been deleted`,
                );
            }

            const session = await this.getSessionFromBatch(
                dto.batchId,
                dto.date,
                conn,
            );

            return await this.attendanceRepo.create(
                {
                    studentId: dto.studentId,
                    sessionId: session.id,
                    status: dto.status,
                    note: dto.note ?? null,
                },
                conn,
            );
        });
    }

    /* =======================
       BULK ATTENDANCE
    ======================= */
    async markBulkAttendance(
        dto: BulkAttendanceDto,
    ): Promise<BulkAttendanceResult> {
        return this.db.transaction<BulkAttendanceResult>(async (conn) => {
            // ── Validate all student IDs upfront ────────────────────────
            const invalidIds: string[] = [];
            for (const record of dto.records) {
                const exists = await this.studentsRepo.exists(record.studentId, conn);
                if (!exists) {
                    invalidIds.push(record.studentId);
                }
            }
            if (invalidIds.length > 0) {
                throw new BadRequestException(
                    `The following student IDs do not exist: ${invalidIds.join(', ')}`,
                );
            }

            const session = await this.getSessionFromBatch(
                dto.batchId,
                dto.date,
                conn,
            );

            await this.attendanceRepo.bulkCreate(
                dto.records.map((r) => ({
                    studentId: r.studentId,
                    sessionId: session.id,
                    status: r.status,
                    note: r.note ?? null,
                })),
                conn,
            );

            return {
                sessionId: session.id,
                total: dto.records.length,
            };
        });
    }

    /* =======================
       UPDATE ATTENDANCE
    ======================= */
    async updateAttendance(
        id: string,
        status: AttendanceRow['status'],
        note?: string,
    ): Promise<AttendanceRow> {
        const existing = await this.attendanceRepo.findById(id);

        if (!existing) {
            throw new NotFoundException('Attendance not found');
        }

        await this.attendanceRepo.updateStatus(id, status, note ?? null);

        const updated = await this.attendanceRepo.findById(id);

        if (!updated) {
            throw new NotFoundException('Attendance not found after update');
        }

        return updated;
    }

    /* =======================
       GET BY SESSION
    ======================= */
    async getBySession(sessionId: string): Promise<AttendanceRow[]> {
        return this.attendanceRepo.findBySessionId(sessionId);
    }

    /* =======================
       GET BY STUDENT
    ======================= */
    async getByStudent(studentId: string): Promise<AttendanceRow[]> {
        return this.attendanceRepo.findByStudentId(studentId);
    }

    /* =======================
       TEACHER ATTENDANCE (🔥)
    ======================= */
    async markTeacherAttendanceByBatch(
        batchId: string,
        date: string,
        status: 'PRESENT' | 'ABSENT',
    ): Promise<{ status: 'PRESENT' | 'ABSENT' | 'CANCELLED'; substituteId?: string; message: string }> {
        return this.db.transaction<any>(async (conn) => {
            const sessionResult = await this.getSessionFromBatch(batchId, date, conn);
            return this.markTeacherAttendanceInternal(sessionResult.id, status, conn);
        });
    }

    async markTeacherAttendance(
        sessionId: string,
        status: 'PRESENT' | 'ABSENT',
    ): Promise<{ status: 'PRESENT' | 'ABSENT' | 'CANCELLED'; substituteId?: string; message: string }> {
        return this.db.transaction<any>(async (conn) => {
            return this.markTeacherAttendanceInternal(sessionId, status, conn);
        });
    }

    private async markTeacherAttendanceInternal(
        sessionId: string,
        status: 'PRESENT' | 'ABSENT',
        conn: PoolConnection,
    ): Promise<{ status: 'PRESENT' | 'ABSENT' | 'CANCELLED'; substituteId?: string; message: string }> {
        const session = await this.sessionRepo.findById(sessionId, conn);
        if (!session) throw new NotFoundException('Session not found');

        if (status === 'PRESENT') {
            await this.sessionRepo.updateTeacherAttendance(sessionId, 'PRESENT', null, conn);
            return { status: 'PRESENT', message: 'Teacher marked as present' };
        }

        // ── Handle Absence ──────────────────────────────────────────
        // Pick the date from the session
        const sessionDate = new Date(session.date);
        const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(sessionDate);

        const freeTeachers = await this.userRepo.findFreeTeachers(
            dayOfWeek,
            session.start_time,
            session.end_time,
            conn,
        );

        if (freeTeachers.length > 0) {
            const sub = freeTeachers[0]; // Pick first candidate
            await this.sessionRepo.updateTeacherAttendance(sessionId, 'ABSENT', sub.id, conn);
            return {
                status: 'ABSENT',
                substituteId: sub.id,
                message: `Teacher absent. Substituted by ${sub.name}`,
            };
        } else {
            // No free teacher found -> Cancel class
            await this.sessionRepo.updateTeacherAttendance(sessionId, 'ABSENT', null, conn);
            await this.sessionRepo.updateStatus(sessionId, 'CANCELLED', conn);
            return {
                status: 'CANCELLED',
                message: 'Teacher absent and no substitutes available. Class cancelled.',
            };
        }
    }

    /* =======================
       INTERNAL: SESSION FLOW
    ======================= */
    private async getSessionFromBatch(
        batchId: string,
        date: string,
        conn?: PoolConnection,
    ): Promise<{ id: string }> {
        const batch = await this.batchRepo.findById(batchId, conn);
        if (!batch) {
            throw new NotFoundException('Batch not found');
        }

        // ── Date Validations ──────────────────────────────────────────
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        if (attendanceDate > today) {
            throw new BadRequestException('Attendance cannot be marked for a future date');
        }

        const startDate = new Date(batch.start_date);
        startDate.setHours(0, 0, 0, 0);

        if (attendanceDate < startDate) {
            throw new BadRequestException(
                `Attendance date cannot be before batch start (${batch.start_date})`
            );
        }

        if (batch.end_date) {
            const endDate = new Date(batch.end_date);
            endDate.setHours(0, 0, 0, 0);

            if (attendanceDate > endDate) {
                throw new BadRequestException(
                    `Attendance date cannot be after batch end (${batch.end_date})`
                );
            }
        }
        // ─────────────────────────────────────────────────────────────

        const { startTime, endTime } = this.parseTimeSlot(batch.time_slot);

        return this.sessionService.findOrCreateSession(
            {
                batchId,
                date,
                startTime,
                endTime,
            },
            conn,
        );
    }

    /* =======================
       HELPER: TIME PARSER
    ======================= */
    private parseTimeSlot(timeSlot: string): {
        startTime: string;
        endTime: string;
    } {
        const [startTime, endTime] = timeSlot.split('-');

        if (!startTime || !endTime) {
            throw new BadRequestException(
                'Invalid batch time slot format',
            );
        }

        return { startTime, endTime };
    }

    /* =======================
       HELPER: DUPLICATE ERROR
    ======================= */
    private isDuplicateError(error: unknown): error is { code: string } {
        return (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            (error as { code: string }).code === 'ER_DUP_ENTRY'
        );
    }
}