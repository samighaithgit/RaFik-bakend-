import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { AssignmentStatus, AssignmentSource } from '../../common/enums';
import { Complaint } from '../../complaints/entities/complaint.entity';
import { Department } from '../../departments/entities/department.entity';
import { User } from '../../users/entities/user.entity';

@Entity('complaint_assignments')
@Index(['complaintId'])
@Index(['departmentId'])
@Index(['assignedToUserId'])
@Index(['status'])
export class ComplaintAssignment extends BaseEntity {
  @Column({ name: 'complaint_id', type: 'uuid' })
  complaintId: string;

  @Column({ name: 'department_id', type: 'uuid' })
  departmentId: string;

  @Column({ name: 'assigned_to_user_id', type: 'uuid', nullable: true })
  assignedToUserId: string | null;

  @Column({ name: 'assigned_by_user_id', type: 'uuid', nullable: true })
  assignedByUserId: string | null;

  @Column({ name: 'assignment_source', type: 'enum', enum: AssignmentSource })
  assignmentSource: AssignmentSource;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'assigned_at', type: 'timestamptz', default: () => 'NOW()' })
  assignedAt: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'enum', enum: AssignmentStatus, default: AssignmentStatus.PENDING })
  status: AssignmentStatus;

  @ManyToOne(() => Complaint, (c) => c.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'complaint_id' })
  complaint: Complaint;

  @ManyToOne(() => Department, (d) => d.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_to_user_id' })
  assignedToUser: User | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_by_user_id' })
  assignedByUser: User | null;
}
