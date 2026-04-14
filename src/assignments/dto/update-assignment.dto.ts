import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentStatus } from '../../common/enums';

export class UpdateAssignmentDto {
  @ApiProperty({ enum: AssignmentStatus })
  @IsEnum(AssignmentStatus)
  status: AssignmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
