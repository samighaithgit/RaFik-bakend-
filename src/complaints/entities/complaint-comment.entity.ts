import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Complaint } from './complaint.entity';
import { User } from '../../users/entities/user.entity';

@Entity('complaint_comments')
@Index(['complaintId'])
@Index(['userId'])
export class ComplaintComment extends BaseEntity {
  @Column({ name: 'complaint_id', type: 'uuid' })
  complaintId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'is_internal', type: 'boolean', default: false })
  isInternal: boolean;

  @ManyToOne(() => Complaint, (c) => c.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'complaint_id' })
  complaint: Complaint;

  @ManyToOne(() => User, (u) => u.comments, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
