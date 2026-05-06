import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { AttendanceStatus } from 'src/common/enums/attendance-status.enum';

export class UpdateAttendanceDto {
  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  @IsNotEmpty()
  status!: AttendanceStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  note?: string;
}
