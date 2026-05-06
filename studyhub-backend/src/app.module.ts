import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { DatabaseService } from './common/database/database.service';
import { ConfigModule } from '@nestjs/config';
// Triggering dev reload
import { DatabaseModule } from './common/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BatchesModule } from './modules/batches/batches.module';
import { EnrollmentModule } from './modules/enrollments/enrollments.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ClassSessionsModule } from './modules/class_sessions/class_sessions.module';
import { StudentsModule } from './modules/students/students.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksModule } from './modules/tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    BatchesModule,
    StudentsModule,
    EnrollmentModule,
    AttendanceModule,
    ClassSessionsModule,
    DashboardModule,
    ReportsModule,
    TasksModule,
    ScheduleModule.forRoot(),
  ],
  providers: [],
  exports: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
