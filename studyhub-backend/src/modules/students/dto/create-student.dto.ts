import { IsString, IsEmail, IsNotEmpty, IsOptional, IsDateString, MinLength, Matches } from 'class-validator';

const PHONE_REGEX = /^[0-9]{10}$/;

export class CreateStudentDto {
    @IsString()
    @IsNotEmpty({ message: 'Student name is required' })
    @MinLength(3, { message: 'Student name must be at least 3 characters long' })

    name!: string;

    @IsString()
    @IsNotEmpty({ message: 'Parent name is required' })
    @MinLength(3, { message: 'Parent name must be at least 3 characters long' })
    parentName!: string;

    @IsString()
    @IsNotEmpty({ message: 'Phone number is required' })
    @Matches(PHONE_REGEX, { message: 'Phone number must be exactly 10 digits' })
    phone!: string;

    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsOptional()
    email?: string;

    @IsDateString({}, { message: 'Please provide a valid date of birth' })
    @IsNotEmpty({ message: 'Date of birth is required' })
    dob!: string;

    @IsString()
    @IsNotEmpty({ message: 'Address is required' })
    @MinLength(10, { message: 'Please enter a complete address (at least 10 letters)' })
    address!: string;
}


