import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({ example: 'OldPass@123' })
    @IsNotEmpty()
    oldPassword!: string;

    @ApiProperty({ example: 'NewPass@123' })
    @IsNotEmpty()
    @MinLength(8)
    @Matches(/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_])/, {
        message: 'Password must contain uppercase, lowercase, number and special character',
    })
    newPassword!: string;
}