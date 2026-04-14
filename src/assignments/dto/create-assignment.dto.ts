import { IsUUID, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentSource } from '../../common/enums';

export class CreateAssignmentDto {
  @ApiProperty()
  @IsUUID()
  complaintId: string;

  @ApiProperty()
  @IsUUID()
  departmentId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @ApiPropertyOptional({ enum: AssignmentSource, default: AssignmentSource.MANUAL })
  @IsOptional()
  @IsEnum(AssignmentSource)
  assignmentSource?: AssignmentSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
