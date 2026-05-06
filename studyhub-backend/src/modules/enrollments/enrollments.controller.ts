import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';


import { EnrollmentService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

import { EnrollmentRow } from './types/enroll-row.type';
import { AddBatchesDto } from './dto/add-batches.dto';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

/* =======================
   RESPONSE TYPES
======================= */

type CreateEnrollmentResponse = EnrollmentRow;

type GetEnrollmentResponse = EnrollmentRow;

type GetByStudentResponse = EnrollmentRow;

/* =======================
   CONTROLLER
======================= */

import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

@ApiTags('Enrollments')
@ApiBearerAuth()
@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentController {
    constructor(
        private readonly service: EnrollmentService,
    ) { }

    /* =======================
       CREATE ENROLLMENT
    ======================= */
    @Post()
    @Roles('ADMIN', 'RECEPTIONIST')
    async createEnrollment(
        @Body() dto: CreateEnrollmentDto,
    ): Promise<CreateEnrollmentResponse> {
        return this.service.enrollStudent(dto);
    }

    @Post(':id/batches')
    @Roles('ADMIN', 'RECEPTIONIST')
    async addBatches(
        @Param('id') id: string,
        @Body() dto: AddBatchesDto,
    ): Promise<EnrollmentRow> {
        return this.service.addBatches(id, dto);
    }

    /* =======================
       UPDATE ENROLLMENT (PAYMENT)
    ======================= */
    @Patch(':id')
    @Roles('ADMIN', 'RECEPTIONIST')
    async updateEnrollment(
        @Param('id') id: string,
        @Body() dto: UpdateEnrollmentDto,
    ): Promise<EnrollmentRow> {
        return this.service.updatePayment(id, dto);
    }


    /* =======================
       GET ACTIVE ENROLLMENT BY STUDENT
    ======================= */
    @Get('student/:studentId')
    @Roles('ADMIN', 'RECEPTIONIST')
    async getByStudent(
        @Param('studentId') studentId: string,
    ): Promise<GetByStudentResponse> {
        return this.service.getActiveEnrollment(studentId);
    }

    /* =======================
       GET ENROLLMENT BY ID
    ======================= */
    @Get(':id')
    @Roles('ADMIN', 'RECEPTIONIST')
    async getById(
        @Param('id') id: string,
    ): Promise<GetEnrollmentResponse> {
        return this.service.getEnrollmentById(id);
    }

    /* =======================
       LEAVE BATCH
    ======================= */
    @Delete(':id/batches/:batchId')
    @Roles('ADMIN', 'RECEPTIONIST')
    async leaveBatch(
        @Param('id') id: string,
        @Param('batchId') batchId: string,
    ): Promise<{ message: string }> {
        await this.service.leaveBatch(id, batchId);
        return { message: 'Successfully left the batch' };
    }
}