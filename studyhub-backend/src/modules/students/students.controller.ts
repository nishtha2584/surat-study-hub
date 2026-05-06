import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { StudentsService } from './students.service';
import { StudentRow } from './students.repository';
import { CreateStudentDto } from './dto/create-student.dto';


import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

/* =======================
   CONTROLLER
======================= */

@ApiTags('Students')
@ApiBearerAuth()
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(
    private readonly service: StudentsService,
  ) { }

  /* =======================
     CREATE
  ======================= */
  @Post()
  @Roles('ADMIN', 'RECEPTIONIST')
  async create(
    @Body() dto: CreateStudentDto,
  ): Promise<StudentRow> {
    return this.service.createStudent(dto);
  }


  /* =======================
     GET ALL
  ======================= */
  @Get()
  @Roles('ADMIN', 'RECEPTIONIST')
  async getAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('paymentStatus') paymentStatus?: string,
  ): Promise<{ items: StudentRow[]; total: number }> {
    return this.service.getAll(
      Number(page),
      Number(limit),
      search,
      paymentStatus,
    );
  }




  /* =======================
     SEARCH
  ======================= */
  @Get('search')
  @Roles('ADMIN', 'RECEPTIONIST')
  async search(
    @Query('q') query: string,
  ): Promise<StudentRow[]> {
    return this.service.searchStudents(query);
  }

  /* =======================
     GET BY ID
  ======================= */
  @Get(':id')
  @Roles('ADMIN', 'RECEPTIONIST')
  async getById(
    @Param('id') id: string,
  ): Promise<StudentRow> {
    return this.service.getStudentById(id);
  }

  /* =======================
     UPDATE
  ======================= */
  @Patch(':id')
  @Roles('ADMIN', 'RECEPTIONIST')
  async update(
    @Param('id') id: string,
    @Body() dto: {
      name?: string;
      email?: string;
      phone?: string;
      parentName?: string;
      dob?: string;
      address?: string;
    },
  ): Promise<StudentRow> {
    return this.service.updateStudent(id, dto);
  }

  /* =======================
     DELETE
  ======================= */
  @Delete(':id')
  @Roles('ADMIN')
  async delete(
    @Param('id') id: string,
  ): Promise<{ id: string }> {
    await this.service.deleteStudent(id);
    return { id };
  }
}