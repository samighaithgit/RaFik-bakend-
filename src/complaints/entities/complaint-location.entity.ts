import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Complaint } from './complaint.entity';

@Entity('complaint_locations')
@Index(['complaintId'], { unique: true })
@Index(['latitude', 'longitude'])
@Index(['neighborhood'])
@Index(['areaName'])
@Index(['city'])
export class ComplaintLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'complaint_id', type: 'uuid', unique: true })
  complaintId: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ name: 'accuracy_meters', type: 'real', nullable: true })
  accuracyMeters: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  neighborhood: string | null;

  @Column({ name: 'area_name', type: 'varchar', length: 255, nullable: true })
  areaName: string | null;

  @Column({ name: 'street_name', type: 'varchar', length: 255, nullable: true })
  streetName: string | null;

  @Column({ type: 'varchar', length: 100, default: 'Hebron' })
  city: string;

  @Column({ type: 'varchar', length: 100, default: 'Hebron' })
  governorate: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToOne(() => Complaint, (c) => c.location, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'complaint_id' })
  complaint: Complaint;
}
