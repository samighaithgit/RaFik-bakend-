import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateNested,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComplaintCategory, ComplaintSource } from '../../common/enums';

export class CreateComplaintLocationDto {
  @ApiProperty({ example: 31.5326 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 35.0998 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ example: 15.5 })
  @IsOptional()
  @IsNumber()
  accuracyMeters?: number;

  @ApiPropertyOptional({ example: 'Old City' })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'Bab al-Zawiya' })
  @IsOptional()
  @IsString()
  areaName?: string;

  @ApiPropertyOptional({ example: 'King Faisal Street' })
  @IsOptional()
  @IsString()
  streetName?: string;
}

export class CreateComplaintImageDto {
  @ApiProperty({ example: 'https://storage.example.com/complaints/img001.jpg' })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({ example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  imageMimeType?: string;

  @ApiPropertyOptional({ example: 245000 })
  @IsOptional()
  @IsNumber()
  imageSize?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateComplaintVoiceNoteDto {
  @ApiProperty({ example: 'https://storage.example.com/complaints/voice001.ogg' })
  @IsString()
  voiceUrl: string;

  @ApiPropertyOptional({ example: 'audio/ogg' })
  @IsOptional()
  @IsString()
  voiceMimeType?: string;

  @ApiPropertyOptional({ example: 128000, description: 'File size in bytes' })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional({ example: 15.3, description: 'Duration in seconds' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationSeconds?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateComplaintDto {
  @ApiPropertyOptional({ example: 'Broken streetlight near school' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({ example: 'The streetlight at King Faisal has been off for 3 days' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ComplaintCategory })
  @IsOptional()
  @IsEnum(ComplaintCategory)
  category?: ComplaintCategory;

  @ApiPropertyOptional({ example: 'STREET_LIGHTING' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subcategory?: string;

  @ApiPropertyOptional({ enum: ComplaintSource, default: ComplaintSource.MOBILE_APP })
  @IsOptional()
  @IsEnum(ComplaintSource)
  source?: ComplaintSource;

  @ApiPropertyOptional({ example: 'Near the old mosque on King Faisal Street' })
  @IsOptional()
  @IsString()
  manuallyEnteredAddress?: string;

  @ApiProperty({ type: CreateComplaintLocationDto })
  @ValidateNested()
  @Type(() => CreateComplaintLocationDto)
  location: CreateComplaintLocationDto;

  @ApiPropertyOptional({ type: [CreateComplaintImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateComplaintImageDto)
  images?: CreateComplaintImageDto[];

  @ApiPropertyOptional({ type: [CreateComplaintVoiceNoteDto], description: 'Voice notes recorded by the citizen' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateComplaintVoiceNoteDto)
  voiceNotes?: CreateComplaintVoiceNoteDto[];
}
