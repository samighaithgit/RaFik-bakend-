import {
  Entity,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { Role } from '../../common/enums';
import { UserDepartment } from '../../departments/entities/user-department.entity';
import { Complaint } from '../../complaints/entities/complaint.entity';
import { ComplaintComment } from '../../complaints/entities/complaint-comment.entity';
import { Notification } from '../../notifications/entities/notification.entity';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['phoneNumber'])
@Index(['role'])
export class User extends BaseEntity {
  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 20, nullable: true })
  phoneNumber: string | null;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  @Exclude()
  passwordHash: string;

  @Column({ type: 'enum', enum: Role, default: Role.CITIZEN })
  role: Role;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @OneToMany(() => UserDepartment, (ud) => ud.user)
  userDepartments: UserDepartment[];

  @OneToMany(() => Complaint, (c) => c.citizen)
  complaints: Complaint[];

  @OneToMany(() => ComplaintComment, (cc) => cc.user)
  comments: ComplaintComment[];

  @OneToMany(() => Notification, (n) => n.user)
  notifications: Notification[];
}
