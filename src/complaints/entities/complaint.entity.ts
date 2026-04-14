import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import {
  ComplaintStatus,
  ComplaintCategory,
  Priority,
  ComplaintSource,
} from '../../common/enums';
import { User } from '../../users/entities/user.entity';
import { Department } from '../../departments/entities/department.entity';
import { ComplaintImage } from './complaint-image.entity';
import { ComplaintLocation } from './complaint-location.entity';
import { ComplaintComment } from './complaint-comment.entity';
import { ComplaintStatusHistory } from './complaint-status-history.entity';
import { ComplaintVoiceNote } from './complaint-voice-note.entity';
import { ComplaintAssignment } from '../../assignments/entities/complaint-assignment.entity';
import { AiAnalysis } from '../../ai-analysis/entities/ai-analysis.entity';

@Entity('complaints')
@Index(['referenceNumber'], { unique: true })
@Index(['status'])
@Index(['category'])
@Index(['priority'])
@Index(['departmentId'])
@Index(['citizenId'])
@Index(['submittedAt'])
@Index(['status', 'priority'])
@Index(['category', 'status'])
@Index(['departmentId', 'status'])
export class Complaint extends BaseEntity {
  @Column({ name: 'reference_number', type: 'varchar', length: 30, unique: true })
  referenceNumber: string;

  @Column({ name: 'citizen_id', type: 'uuid' })
  citizenId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: ComplaintCategory, default: ComplaintCategory.OTHER })
  category: ComplaintCategory;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subcategory: string | null;

  @Column({ type: 'enum', enum: ComplaintStatus, default: ComplaintStatus.SUBMITTED })
  status: ComplaintStatus;

  @Column({ type: 'enum', enum: Priority, default: Priority.MEDIUM })
  priority: Priority;

  @Column({ type: 'enum', enum: ComplaintSource, default: ComplaintSource.MOBILE_APP })
  source: ComplaintSource;

  @Column({ name: 'manually_entered_address', type: 'text', nullable: true })
  manuallyEnteredAddress: string | null;

  @Column({ name: 'detected_address', type: 'text', nullable: true })
  detectedAddress: string | null;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId: string | null;

  @Column({ name: 'ai_suggested_department_id', type: 'uuid', nullable: true })
  aiSuggestedDepartmentId: string | null;

  @Column({ name: 'assigned_by_system', type: 'boolean', default: false })
  assignedBySystem: boolean;

  @Column({ name: 'is_duplicate', type: 'boolean', default: false })
  isDuplicate: boolean;

  @Column({ name: 'duplicate_of_complaint_id', type: 'uuid', nullable: true })
  duplicateOfComplaintId: string | null;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  // Relations
  @ManyToOne(() => User, (u) => u.complaints, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'citizen_id' })
  citizen: User;

  @ManyToOne(() => Department, (d) => d.complaints, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'department_id' })
  department: Department | null;

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ai_suggested_department_id' })
  aiSuggestedDepartment: Department | null;

  @ManyToOne(() => Complaint, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'duplicate_of_complaint_id' })
  duplicateOfComplaint: Complaint | null;

  @OneToMany(() => ComplaintImage, (ci) => ci.complaint, { cascade: true })
  images: ComplaintImage[];

  @OneToMany(() => ComplaintVoiceNote, (vn) => vn.complaint, { cascade: true })
  voiceNotes: ComplaintVoiceNote[];

  @OneToOne(() => ComplaintLocation, (cl) => cl.complaint, { cascade: true })
  location: ComplaintLocation;

  @OneToMany(() => ComplaintComment, (cc) => cc.complaint, { cascade: true })
  comments: ComplaintComment[];

  @OneToMany(() => ComplaintStatusHistory, (csh) => csh.complaint, { cascade: true })
  statusHistory: ComplaintStatusHistory[];

  @OneToMany(() => ComplaintAssignment, (ca) => ca.complaint, { cascade: true })
  assignments: ComplaintAssignment[];

  @OneToMany(() => AiAnalysis, (aa) => aa.complaint, { cascade: true })
  aiAnalyses: AiAnalysis[];
}
