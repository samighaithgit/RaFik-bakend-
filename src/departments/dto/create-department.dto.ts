import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DepartmentType } from '../../common/enums';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Electricity Department' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'ELECTRICITY' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ enum: DepartmentType, example: DepartmentType.UTILITIES })
  @IsEnum(DepartmentType)
  type: DepartmentType;

  @ApiPropertyOptional({ example: 'Handles all electrical infrastructure issues' })
  @IsOptional()
  @IsString()
  description?: string;
}
