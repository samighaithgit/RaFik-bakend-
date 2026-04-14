import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty()
  @IsUUID()
  complaintId: string;

  @ApiProperty({ example: 'Inspection team dispatched to the location' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ description: 'Internal comments are not visible to citizens' })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}
