import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEmail } from 'class-validator';

export class UpdateUserDto {
    @ApiPropertyOptional()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string;
}