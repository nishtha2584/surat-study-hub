import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { DashboardRepository } from './dashboard.repository';
import { DatabaseModule } from 'src/common/database/database.module';
import { AuthGuard } from '@nestjs/passport';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [DashboardService, DashboardRepository],
  controllers: [DashboardController]
})
export class DashboardModule { }
