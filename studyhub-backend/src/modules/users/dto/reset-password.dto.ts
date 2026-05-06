import { ApiProperty } from '@nestjs/swagger';
import { MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty()
    @MinLength(8)
    @Matches(/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_])/)
    newPassword!: string;
}