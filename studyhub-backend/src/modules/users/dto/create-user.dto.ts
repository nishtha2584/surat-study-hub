import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, Matches, IsEnum } from 'class-validator';
import { UserRole } from 'src/common/enums/user-role.enum';

export class CreateUserDto {
    @ApiProperty({ example: 'John Doe' })
    @IsNotEmpty({ message: 'Name is required' })
    @MinLength(3, { message: 'Name must be at least 3 characters long' })
    name!: string;

    @ApiProperty({ example: 'john.doe@example.com' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email!: string;

    @ApiProperty({ example: 'Password@123' })
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_])/, {
        message: 'Password must contain uppercase, lowercase, number and special character',
    })
    password!: string;

    @IsEnum(UserRole, {
        message: 'Role must be ADMIN, TEACHER or RECEPTIONIST',
    })
    @ApiProperty({ example: 'TEACHER' })
    @IsNotEmpty({ message: 'Role is required' })
    role!: UserRole;
}