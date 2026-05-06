import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { RequestWithUser } from 'src/common/types/request-with-user.type';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
    constructor(private readonly service: DashboardService) { }

    @Get()
    async getDashboard(@Req() req: RequestWithUser) {
        const userRole = req.user.role;
        const userId = req.user.userId;

        if (userRole === 'TEACHER') {
            return this.service.getTeacherDashboard(userId);
        }

        if (userRole === 'RECEPTIONIST') {
            return this.service.getReceptionistDashboard();
        }

        // Default to admin dashboard for ADMIN
        return this.service.getDashboard();
    }

}