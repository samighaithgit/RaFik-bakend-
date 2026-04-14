import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { Complaint } from './complaint.entity';

@Entity('complaint_voice_notes')
@Index(['complaintId'])
export class ComplaintVoiceNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'complaint_id', type: 'uuid' })
  complaintId: string;

  @Column({ name: 'voice_url', type: 'varchar', length: 1024 })
  voiceUrl: string;

  @Column({ name: 'voice_mime_type', type: 'varchar', length: 50, nullable: true })
  voiceMimeType: string | null;

  @Column({ name: 'file_size', type: 'integer', nullable: true })
  fileSize: number | null;

  @Column({ name: 'duration_seconds', type: 'real', nullable: true })
  durationSeconds: number | null;

  @Column({ name: 'transcription', type: 'text', nullable: true })
  transcription: string | null;

  @Column({ name: 'transcription_language', type: 'varchar', length: 10, nullable: true })
  transcriptionLanguage: string | null;

  @Column({ name: 'is_transcribed', type: 'boolean', default: false })
  isTranscribed: boolean;

  @Column({ name: 'sort_order', type: 'smallint', default: 0 })
  sortOrder: number;

  @Column({ name: 'uploaded_at', type: 'timestamptz', default: () => 'NOW()' })
  uploadedAt: Date;

  @ManyToOne(() => Complaint, (c) => c.voiceNotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'complaint_id' })
  complaint: Complaint;
}
