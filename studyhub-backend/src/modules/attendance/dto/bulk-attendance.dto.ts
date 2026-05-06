import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsEnum, IsDateString, IsOptional, ValidateNested, IsArray, IsUUID } from 'class-validator';
import { AttendanceStatus } from 'src/common/enums/attendance-status.enum';

export class BulkAttendanceRecordDto {
  @ApiProperty({ example: 'student-uuid' })
  @IsUUID('all')
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  note?: string;
}

export class BulkAttendanceDto {
  @ApiProperty({ example: 'batch-uuid' })
  @IsUUID('all')
  @IsNotEmpty()
  batchId!: string;

  @ApiProperty({ example: '2026-04-20', description: 'YYYY-MM-DD' })
  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @ApiProperty({ type: [BulkAttendanceRecordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceRecordDto)
  records!: BulkAttendanceRecordDto[];
}
