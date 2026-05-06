import {
    Controller,
    Post,
    Body,
    Get,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';

import { LoginResponse } from './types/login-response.type';
import { RefreshResponse } from './types/refresh-response.type';
import { MeResponse } from './types/me-response.type';
import { LogoutResponse } from './types/logout-response.type';

type RequestWithUser = Request & {
    user: {
        userId: string;
        role: string;
    };
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /* =======================
       LOGIN
    ======================= */
    @ApiBody({ type: LoginDto })
    @Post('login')
    async login(
        @Body() dto: LoginDto,
    ): Promise<LoginResponse> {
        return this.authService.login(dto);
    }

    /* =======================
       REFRESH TOKEN
    ======================= */
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiBody({ type: RefreshDto })
    @Post('refresh')
    async refresh(
        @Body() dto: RefreshDto,
    ): Promise<RefreshResponse> {
        return this.authService.refresh(dto);
    }

    /* =======================
       LOGOUT (single device)
    ======================= */
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiBody({ type: LogoutDto })
    @Post('logout')
    async logout(
        @Body() dto: LogoutDto,
    ): Promise<LogoutResponse> {
        return this.authService.logout(dto);
    }

    /* =======================
       LOGOUT ALL DEVICES
    ======================= */
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @Post('logout-all')
    async logoutAll(
        @Req() req: RequestWithUser,
    ): Promise<LogoutResponse> {
        return this.authService.logoutAll(req.user.userId);
    }

    /* =======================
       CURRENT USER
    ======================= */
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me')
    async me(
        @Req() req: RequestWithUser,
    ): Promise<MeResponse> {
        return this.authService.getMe(req.user.userId);
    }
}