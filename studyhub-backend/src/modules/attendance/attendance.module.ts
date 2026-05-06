import { Module, forwardRef } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { DatabaseModule } from 'src/common/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AttendanceRepository } from './attendance.repository';
import { ClassSessionsService } from '../class_sessions/class_sessions.service';
import { BatchesModule } from '../batches/batches.module';
import { ClassSessionsRepository } from '../class_sessions/class-sessions.repository';

import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';

@Module({
  imports: [DatabaseModule, AuthModule, forwardRef(() => BatchesModule), UsersModule, StudentsModule],
  controllers: [AttendanceController],
  providers: [
    AttendanceService,
    AttendanceRepository,
    ClassSessionsService,
    ClassSessionsRepository,
  ],
  exports: [AttendanceService],
})
export class AttendanceModule { }
