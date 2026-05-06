import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LogoutDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        example: 'paste-refresh-token-here',
    })
    refreshToken!: string;
}