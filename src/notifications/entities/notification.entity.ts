import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { NotificationType } from '../../common/enums';
import { User } from '../../users/entities/user.entity';
import { Complaint } from '../../complaints/entities/complaint.entity';

@Entity('notifications')
@Index(['userId'])
@Index(['isRead'])
@Index(['userId', 'isRead'])
@Index(['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'related_complaint_id', type: 'uuid', nullable: true })
  relatedComplaintId: string | null;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => User, (u) => u.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Complaint, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'related_complaint_id' })
  relatedComplaint: Complaint | null;
}
