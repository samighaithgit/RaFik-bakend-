import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplaintAssignment } from './entities/complaint-assignment.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { AssignmentSource, AssignmentStatus } from '../common/enums';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(ComplaintAssignment)
    private readonly assignmentRepository: Repository<ComplaintAssignment>,
  ) {}

  async create(dto: CreateAssignmentDto, assignedBy: User): Promise<ComplaintAssignment> {
    const assignment = this.assignmentRepository.create({
      complaintId: dto.complaintId,
      departmentId: dto.departmentId,
      assignedToUserId: dto.assignedToUserId || null,
      assignedByUserId: assignedBy.id,
      assignmentSource: dto.assignmentSource || AssignmentSource.MANUAL,
      notes: dto.notes || null,
      status: AssignmentStatus.PENDING,
    });

    return this.assignmentRepository.save(assignment);
  }

  async findByComplaint(complaintId: string): Promise<ComplaintAssignment[]> {
    return this.assignmentRepository.find({
      where: { complaintId },
      relations: ['department', 'assignedToUser', 'assignedByUser'],
      order: { assignedAt: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateAssignmentDto): Promise<ComplaintAssignment> {
    const assignment = await this.assignmentRepository.findOne({ where: { id } });
    if (!assignment) {
      throw new NotFoundException(`Assignment ${id} not found`);
    }

    assignment.status = dto.status;
    if (dto.notes) {
      assignment.notes = dto.notes;
    }

    if (dto.status === AssignmentStatus.ACCEPTED) {
      assignment.acceptedAt = new Date();
    }
    if (dto.status === AssignmentStatus.COMPLETED) {
      assignment.completedAt = new Date();
    }

    return this.assignmentRepository.save(assignment);
  }
}
