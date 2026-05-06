import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { AttendanceStatus } from 'src/common/enums/attendance-status.enum';

export class MarkTeacherAttendanceDto {
  @ApiProperty({ example: 'batch-uuid' })
  @IsUUID('all')
  @IsNotEmpty()
  batchId!: string;

  @ApiProperty({ example: '2026-04-20', description: 'YYYY-MM-DD' })
  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @ApiProperty({ enum: ['PRESENT', 'ABSENT'] })
  @IsEnum(['PRESENT', 'ABSENT'])
  status!: 'PRESENT' | 'ABSENT';
}
