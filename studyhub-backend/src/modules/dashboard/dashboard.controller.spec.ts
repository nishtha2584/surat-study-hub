import { Controller, Get, UseGuards } from '@nestjs/common';

import { DashboardService } from './dashboard.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardResponse } from './types/dashboard.types';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) { }

  @Get()
  async getDashboard(): Promise<DashboardResponse> {
    return this.service.getDashboard();
  }
}