import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  COMPLAINT_EVENTS,
  ComplaintCreatedEvent,
} from '../../complaints/events/complaint-events';
import { AiAnalysis } from '../entities/ai-analysis.entity';
import { Complaint } from '../../complaints/entities/complaint.entity';
import { Department } from '../../departments/entities/department.entity';
import type { IAiProvider, AiAnalysisInput } from '../providers/ai-provider.interface';
import { AI_PROVIDER } from '../providers/ai-provider.interface';
import { AiAnalysisStatus, ComplaintStatus } from '../../common/enums';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Listens for complaint.created events and automatically triggers
 * AI analysis using the configured AI provider.
 *
 * This is the main integration point between complaint submission
 * and AI-powered classification/routing.
 */
@Injectable()
export class ComplaintCreatedListener {
  private readonly logger = new Logger(ComplaintCreatedListener.name);

  constructor(
    @Inject(AI_PROVIDER)
    private readonly aiProvider: IAiProvider,
    @InjectRepository(AiAnalysis)
    private readonly analysisRepository: Repository<AiAnalysis>,
    @InjectRepository(Complaint)
    private readonly complaintRepository: Repository<Complaint>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent(COMPLAINT_EVENTS.CREATED, { async: true })
  async handleComplaintCreated(event: ComplaintCreatedEvent): Promise<void> {
    this.logger.log(
      `AI analysis triggered for complaint ${event.referenceNumber} (${event.complaintId})`,
    );

    const modelName = this.aiProvider.getModelName();

    // Create pending analysis record
    let analysis = this.analysisRepository.create({
      complaintId: event.complaintId,
      modelName,
      analysisStatus: AiAnalysisStatus.PROCESSING,
    });
    analysis = await this.analysisRepository.save(analysis);

    try {
      // Check if provider is available
      const available = await this.aiProvider.isAvailable();
      if (!available) {
        this.logger.warn(
          `AI provider '${modelName}' is not available. Skipping analysis for ${event.referenceNumber}`,
        );
        analysis.analysisStatus = AiAnalysisStatus.FAILED;
        await this.analysisRepository.save(analysis);
        return;
      }

      // Build input context
      const input: AiAnalysisInput = {
        complaintId: event.complaintId,
        imageUrls: event.imageUrls,
        voiceNoteUrls: event.voiceNoteUrls,
        description: event.description,
        title: event.title,
        latitude: event.latitude,
        longitude: event.longitude,
        neighborhood: event.neighborhood,
      };

      // Run analysis
      const result = await this.aiProvider.analyzeComplaint(input);

      // Resolve suggested department ID from code
      let suggestedDepartmentId: string | null = null;
      if (result.suggestedDepartmentCode) {
        const dept = await this.departmentRepository.findOne({
          where: { code: result.suggestedDepartmentCode, isActive: true },
        });
        suggestedDepartmentId = dept?.id || null;
      }

      // Update analysis record
      analysis.rawLabel = result.rawLabel;
      analysis.predictedCategory = result.predictedCategory;
      analysis.generatedDescription = result.generatedDescription;
      analysis.suggestedDepartmentId = suggestedDepartmentId;
      analysis.confidenceScore = result.confidenceScore;
      analysis.severityScore = result.severityScore;
      analysis.repeatLikelihoodScore = result.repeatLikelihoodScore;
      analysis.rawPayloadJson = result.rawPayload;
      analysis.analysisStatus = AiAnalysisStatus.COMPLETED;
      analysis.analyzedAt = new Date();

      await this.analysisRepository.save(analysis);

      // Update complaint with AI results
      const complaintUpdates: Record<string, unknown> = {
        status: ComplaintStatus.AI_ANALYZED,
      };
      if (suggestedDepartmentId) {
        complaintUpdates.aiSuggestedDepartmentId = suggestedDepartmentId;
      }
      if (result.predictedCategory) {
        // Only override if citizen didn't specify or chose OTHER
        const complaint = await this.complaintRepository.findOne({
          where: { id: event.complaintId },
        });
        if (complaint && complaint.category === 'OTHER') {
          complaintUpdates.category = result.predictedCategory;
        }
      }

      await this.complaintRepository.update(event.complaintId, complaintUpdates);

      this.logger.log(
        `AI analysis completed for ${event.referenceNumber}: ` +
        `category=${result.predictedCategory}, dept=${result.suggestedDepartmentCode}, ` +
        `confidence=${result.confidenceScore}`,
      );

      // Emit completion event for downstream consumers (notifications, etc.)
      this.eventEmitter.emit(COMPLAINT_EVENTS.AI_ANALYSIS_COMPLETED, {
        complaintId: event.complaintId,
        analysisId: analysis.id,
        predictedCategory: result.predictedCategory,
        suggestedDepartmentCode: result.suggestedDepartmentCode,
        confidenceScore: result.confidenceScore,
      });
    } catch (error) {
      this.logger.error(
        `AI analysis failed for ${event.referenceNumber}: ${error.message}`,
        error.stack,
      );
      analysis.analysisStatus = AiAnalysisStatus.FAILED;
      analysis.rawPayloadJson = { error: error.message };
      await this.analysisRepository.save(analysis);
    }
  }
}
