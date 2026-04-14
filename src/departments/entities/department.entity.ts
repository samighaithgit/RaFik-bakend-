import {
  Entity,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { DepartmentType } from '../../common/enums';
import { UserDepartment } from './user-department.entity';
import { Complaint } from '../../complaints/entities/complaint.entity';
import { ComplaintAssignment } from '../../assignments/entities/complaint-assignment.entity';

@Entity('departments')
@Index(['code'], { unique: true })
@Index(['isActive'])
export class Department extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'enum', enum: DepartmentType })
  type: DepartmentType;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => UserDepartment, (ud) => ud.department)
  userDepartments: UserDepartment[];

  @OneToMany(() => Complaint, (c) => c.department)
  complaints: Complaint[];

  @OneToMany(() => ComplaintAssignment, (ca) => ca.department)
  assignments: ComplaintAssignment[];
}
