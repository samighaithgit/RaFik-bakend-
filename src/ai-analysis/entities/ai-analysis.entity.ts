import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { AiAnalysisStatus, ComplaintCategory } from '../../common/enums';
import { Complaint } from '../../complaints/entities/complaint.entity';
import { Department } from '../../departments/entities/department.entity';

@Entity('ai_analyses')
@Index(['complaintId'])
@Index(['analysisStatus'])
@Index(['predictedCategory'])
export class AiAnalysis extends BaseEntity {
  @Column({ name: 'complaint_id', type: 'uuid' })
  complaintId: string;

  @Column({ name: 'model_name', type: 'varchar', length: 100 })
  modelName: string;

  @Column({ name: 'raw_label', type: 'varchar', length: 255, nullable: true })
  rawLabel: string | null;

  @Column({
    name: 'predicted_category',
    type: 'enum',
    enum: ComplaintCategory,
    nullable: true,
  })
  predictedCategory: ComplaintCategory | null;

  @Column({ name: 'generated_description', type: 'text', nullable: true })
  generatedDescription: string | null;

  @Column({ name: 'suggested_department_id', type: 'uuid', nullable: true })
  suggestedDepartmentId: string | null;

  @Column({ name: 'confidence_score', type: 'decimal', precision: 5, scale: 4, nullable: true })
  confidenceScore: number | null;

  @Column({ name: 'severity_score', type: 'decimal', precision: 5, scale: 4, nullable: true })
  severityScore: number | null;

  @Column({ name: 'repeat_likelihood_score', type: 'decimal', precision: 5, scale: 4, nullable: true })
  repeatLikelihoodScore: number | null;

  @Column({
    name: 'analysis_status',
    type: 'enum',
    enum: AiAnalysisStatus,
    default: AiAnalysisStatus.PENDING,
  })
  analysisStatus: AiAnalysisStatus;

  @Column({ name: 'analyzed_at', type: 'timestamptz', nullable: true })
  analyzedAt: Date | null;

  @Column({ name: 'raw_payload_json', type: 'jsonb', nullable: true })
  rawPayloadJson: Record<string, unknown> | null;

  @ManyToOne(() => Complaint, (c) => c.aiAnalyses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'complaint_id' })
  complaint: Complaint;

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'suggested_department_id' })
  suggestedDepartment: Department | null;
}
