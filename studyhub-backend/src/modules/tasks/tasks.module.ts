import { Module } from '@nestjs/common';
import { DailyReportTask } from './daily-report.task';

@Module({
    providers: [DailyReportTask],
})
export class TasksModule {}
