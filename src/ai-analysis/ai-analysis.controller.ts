import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiAnalysisService } from './ai-analysis.service';
import { CreateAiAnalysisDto } from './dto/create-ai-analysis.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';

@ApiTags('AI Analysis')
@ApiBearerAuth()
@Controller('ai-analysis')
export class AiAnalysisController {
  constructor(private readonly aiAnalysisService: AiAnalysisService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.MUNICIPAL_ADMIN)
  @ApiOperation({ summary: 'Submit AI analysis result for a complaint' })
  create(@Body() dto: CreateAiAnalysisDto) {
    return this.aiAnalysisService.create(dto);
  }

  @Get('complaint/:complaintId')
  @ApiOperation({ summary: 'Get AI analyses for a complaint' })
  findByComplaint(@Param('complaintId', ParseUUIDPipe) complaintId: string) {
    return this.aiAnalysisService.findByComplaint(complaintId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get AI analysis by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.aiAnalysisService.findOne(id);
  }
}
