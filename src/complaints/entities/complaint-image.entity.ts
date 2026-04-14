import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { Complaint } from './complaint.entity';

@Entity('complaint_images')
@Index(['complaintId'])
export class ComplaintImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'complaint_id', type: 'uuid' })
  complaintId: string;

  @Column({ name: 'image_url', type: 'varchar', length: 1024 })
  imageUrl: string;

  @Column({ name: 'image_mime_type', type: 'varchar', length: 50, nullable: true })
  imageMimeType: string | null;

  @Column({ name: 'image_size', type: 'integer', nullable: true })
  imageSize: number | null;

  @Column({ name: 'sort_order', type: 'smallint', default: 0 })
  sortOrder: number;

  @Column({ name: 'uploaded_at', type: 'timestamptz', default: () => 'NOW()' })
  uploadedAt: Date;

  @ManyToOne(() => Complaint, (c) => c.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'complaint_id' })
  complaint: Complaint;
}
