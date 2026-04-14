import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiAnalysis } from './entities/ai-analysis.entity';
import { CreateAiAnalysisDto } from './dto/create-ai-analysis.dto';
import { AiAnalysisStatus, ComplaintStatus } from '../common/enums';
import { Complaint } from '../complaints/entities/complaint.entity';

@Injectable()
export class AiAnalysisService {
  private readonly logger = new Logger(AiAnalysisService.name);

  constructor(
    @InjectRepository(AiAnalysis)
    private readonly analysisRepository: Repository<AiAnalysis>,
    @InjectRepository(Complaint)
    private readonly complaintRepository: Repository<Complaint>,
  ) {}

  async create(dto: CreateAiAnalysisDto): Promise<AiAnalysis> {
    const analysis = this.analysisRepository.create({
      ...dto,
      analysisStatus: dto.analysisStatus || AiAnalysisStatus.COMPLETED,
      analyzedAt: new Date(),
    });

    const saved = await this.analysisRepository.save(analysis);

    // Update complaint with AI suggestions if analysis was successful
    if (dto.analysisStatus === AiAnalysisStatus.COMPLETED || !dto.analysisStatus) {
      await this.applyAnalysisToComplaint(dto);
    }

    return saved;
  }

  async findByComplaint(complaintId: string): Promise<AiAnalysis[]> {
    return this.analysisRepository.find({
      where: { complaintId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<AiAnalysis> {
    const analysis = await this.analysisRepository.findOne({
      where: { id },
      relations: ['complaint', 'suggestedDepartment'],
    });
    if (!analysis) {
      throw new NotFoundException(`AI Analysis ${id} not found`);
    }
    return analysis;
  }

  private async applyAnalysisToComplaint(dto: CreateAiAnalysisDto): Promise<void> {
    const complaint = await this.complaintRepository.findOne({
      where: { id: dto.complaintId },
    });
    if (!complaint) return;

    const updates: Record<string, unknown> = {};

    if (dto.suggestedDepartmentId) {
      updates.aiSuggestedDepartmentId = dto.suggestedDepartmentId;
    }
    if (dto.predictedCategory && complaint.category === 'OTHER') {
      updates.category = dto.predictedCategory;
    }
    if (complaint.status === ComplaintStatus.SUBMITTED) {
      updates.status = ComplaintStatus.AI_ANALYZED;
    }

    if (Object.keys(updates).length > 0) {
      await this.complaintRepository.update(complaint.id, updates);
      this.logger.log(`Applied AI analysis to complaint ${complaint.referenceNumber}`);
    }
  }
}
