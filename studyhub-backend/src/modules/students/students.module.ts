import { Module } from '@nestjs/common';

import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { StudentsRepository } from './students.repository';
import { DatabaseModule } from 'src/common/database/database.module';
import { AuthModule } from '../auth/auth.module';

import { EnrollmentModule } from '../enrollments/enrollments.module';

@Module({
  imports: [DatabaseModule, AuthModule, EnrollmentModule],

  controllers: [StudentsController],
  providers: [
    StudentsService,
    StudentsRepository,
  ],
  exports: [StudentsService, StudentsRepository],
})
export class StudentsModule { }