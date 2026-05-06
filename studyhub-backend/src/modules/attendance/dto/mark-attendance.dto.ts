import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { AttendanceStatus } from 'src/common/enums/attendance-status.enum';

export class MarkAttendanceDto {
  @ApiProperty({ example: 'batch-uuid' })
  @IsUUID('all')
  @IsNotEmpty()
  batchId!: string;

  @ApiProperty({ example: 'student-uuid' })
  @IsUUID('all')
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({ example: '2026-04-20', description: 'YYYY-MM-DD' })
  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  note?: string;
}