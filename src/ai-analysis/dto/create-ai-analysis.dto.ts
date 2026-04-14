import {
  IsUUID,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComplaintCategory, AiAnalysisStatus } from '../../common/enums';

export class CreateAiAnalysisDto {
  @ApiProperty()
  @IsUUID()
  complaintId: string;

  @ApiProperty({ example: 'gpt-4-vision' })
  @IsString()
  modelName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rawLabel?: string;

  @ApiPropertyOptional({ enum: ComplaintCategory })
  @IsOptional()
  @IsEnum(ComplaintCategory)
  predictedCategory?: ComplaintCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  generatedDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  suggestedDepartmentId?: string;

  @ApiPropertyOptional({ example: 0.95 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceScore?: number;

  @ApiPropertyOptional({ example: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  severityScore?: number;

  @ApiPropertyOptional({ example: 0.3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  repeatLikelihoodScore?: number;

  @ApiPropertyOptional({ enum: AiAnalysisStatus })
  @IsOptional()
  @IsEnum(AiAnalysisStatus)
  analysisStatus?: AiAnalysisStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  rawPayloadJson?: Record<string, unknown>;
}
