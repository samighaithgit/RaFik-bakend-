import { IsUUID, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../../common/enums';

export class CreateNotificationDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'Complaint Status Updated' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Your complaint HBR-20260414-ABC123 has been resolved.' })
  @IsString()
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  relatedComplaintId?: string;
}
