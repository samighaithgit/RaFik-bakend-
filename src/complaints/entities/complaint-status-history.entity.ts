import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { ComplaintStatus } from '../../common/enums';
import { Complaint } from './complaint.entity';
import { User } from '../../users/entities/user.entity';

@Entity('complaint_status_history')
@Index(['complaintId'])
@Index(['changedAt'])
export class ComplaintStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'complaint_id', type: 'uuid' })
  complaintId: string;

  @Column({ name: 'old_status', type: 'enum', enum: ComplaintStatus, nullable: true })
  oldStatus: ComplaintStatus | null;

  @Column({ name: 'new_status', type: 'enum', enum: ComplaintStatus })
  newStatus: ComplaintStatus;

  @Column({ name: 'changed_by_user_id', type: 'uuid', nullable: true })
  changedByUserId: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'changed_at', type: 'timestamptz', default: () => 'NOW()' })
  changedAt: Date;

  @ManyToOne(() => Complaint, (c) => c.statusHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'complaint_id' })
  complaint: Complaint;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changed_by_user_id' })
  changedByUser: User | null;
}
