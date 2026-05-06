import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ClassSessionsService } from './class_sessions.service';
import { ClassSessionRow } from './class-sessions.repository';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

/* =======================
   TYPES (Response DTOs)
======================= */

type SessionActionResponse = {
  sessionId: string;
  status: ClassSessionRow['status'];
};

/* =======================
   CONTROLLER
======================= */

@ApiTags('Class_sessions')
@ApiBearerAuth()
@Controller('class-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassSessionsController {
  constructor(
    private readonly service: ClassSessionsService,
  ) { }

  /* =======================
     GET BY BATCH
  ======================= */
  @Get('batch/:batchId')
  @Roles('ADMIN', 'TEACHER')
  async getByBatch(
    @Param('batchId') batchId: string,
  ): Promise<ClassSessionRow[]> {
    return this.service.getByBatch(batchId);
  }

  /* =======================
     GET BY ID
  ======================= */
  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  async getById(
    @Param('id') id: string,
  ): Promise<ClassSessionRow> {
    return this.service.getById(id);
  }

  /* =======================
     GET BY DATE RANGE
  ======================= */
  @Get('batch/:batchId/range')
  @Roles('ADMIN', 'TEACHER')
  async getByBatchAndRange(
    @Param('batchId') batchId: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ): Promise<ClassSessionRow[]> {
    return this.service.getByBatchAndDateRange(
      batchId,
      fromDate,
      toDate,
    );
  }

  /* =======================
     MARK COMPLETED
  ======================= */
  @Patch(':id/complete')
  @Roles('ADMIN', 'TEACHER')
  async markCompleted(
    @Param('id') id: string,
  ): Promise<SessionActionResponse> {
    const session = await this.service.markCompleted(id);

    return {
      sessionId: session.id,
      status: session.status,
    };
  }

  /* =======================
     CANCEL SESSION
  ======================= */
  @Patch(':id/cancel')
  @Roles('ADMIN', 'TEACHER')
  async cancelSession(
    @Param('id') id: string,
  ): Promise<SessionActionResponse> {
    const session = await this.service.cancelSession(id);

    return {
      sessionId: session.id,
      status: session.status,
    };
  }
}