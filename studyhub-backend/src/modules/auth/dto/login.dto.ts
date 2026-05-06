import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
    @IsEmail()
    @IsNotEmpty()
    @ApiProperty({
        example: 'nishtha.rathod@studyhub.com',
    })
    email!: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        example: 'Admin@123',
    })
    password!: string;
}