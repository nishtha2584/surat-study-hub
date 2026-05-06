import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';

import { AttendanceService } from './attendance.service';
import { AttendanceRow } from './types/attendance-row.type';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AttendanceStatus } from 'src/common/enums/attendance-status.enum';

import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { MarkTeacherAttendanceDto } from './dto/mark-teacher-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

/* =======================
   TYPES
======================= */

type BulkAttendanceResponse = {
  sessionId: string;
  total: number;
};

type UpdateAttendanceResponse = {
  id: string;
  status: AttendanceStatus;
};

/* =======================
   CONTROLLER
======================= */

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(
    private readonly service: AttendanceService,
  ) { }

  /* =======================
     MARK SINGLE ATTENDANCE
  ======================= */
  @Post()
  @ApiOperation({ summary: 'Mark single student attendance' })
  @Roles('TEACHER', 'ADMIN')
  async markAttendance(
    @Body() dto: MarkAttendanceDto,
  ): Promise<AttendanceRow> {
    return this.service.markAttendance(dto);
  }

  /* =======================
     MARK TEACHER ATTENDANCE (🔥)
  ======================= */
  @Post('teacher')
  @ApiOperation({ summary: 'Mark teacher attendance for a specific batch/date' })
  @Roles('ADMIN', 'RECEPTIONIST')
  async markTeacherAttendance(
    @Body() dto: MarkTeacherAttendanceDto,
  ): Promise<{ status: string; substituteId?: string; message: string }> {
    return this.service.markTeacherAttendanceByBatch(dto.batchId, dto.date, dto.status);
  }

  /* =======================
     BULK ATTENDANCE
  ======================= */
  @Post('bulk')
  @ApiOperation({ summary: 'Mark bulk attendance for a batch' })
  @Roles('TEACHER', 'ADMIN')
  async markBulkAttendance(
    @Body() dto: BulkAttendanceDto,
  ): Promise<BulkAttendanceResponse> {
    const result = await this.service.markBulkAttendance(dto);

    return {
      sessionId: result.sessionId,
      total: result.total,
    };
  }

  /* =======================
     UPDATE ATTENDANCE
  ======================= */
  @Patch(':id')
  @ApiOperation({ summary: 'Update existing attendance record' })
  @Roles('TEACHER', 'ADMIN')
  async updateAttendance(
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
  ): Promise<UpdateAttendanceResponse> {
    const updated = await this.service.updateAttendance(
      id,
      dto.status,
      dto.note,
    );

    return {
      id: updated.id,
      status: updated.status,
    };
  }

  /* =======================
     GET BY SESSION
  ======================= */
  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get attendance records for a specific session' })
  @Roles('TEACHER', 'ADMIN')
  async getBySession(
    @Param('sessionId') sessionId: string,
  ): Promise<AttendanceRow[]> {
    return this.service.getBySession(sessionId);
  }

  /* =======================
     GET BY STUDENT
  ======================= */
  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get attendance history for a specific student' })
  @Roles('ADMIN', 'TEACHER')
  async getByStudent(
    @Param('studentId') studentId: string,
  ): Promise<AttendanceRow[]> {
    return this.service.getByStudent(studentId);
  }
}