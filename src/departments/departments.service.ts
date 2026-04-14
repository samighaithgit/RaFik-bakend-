import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { UserDepartment } from './entities/user-department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { AssignUserDepartmentDto } from './dto/assign-user-department.dto';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(UserDepartment)
    private readonly userDepartmentRepository: Repository<UserDepartment>,
  ) {}

  async create(dto: CreateDepartmentDto): Promise<Department> {
    const existing = await this.departmentRepository.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Department code '${dto.code}' already exists`);
    }

    const department = this.departmentRepository.create(dto);
    return this.departmentRepository.save(department);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResponseDto<Department>> {
    const [data, total] = await this.departmentRepository.findAndCount({
      order: { name: pagination.sortOrder || 'ASC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return new PaginatedResponseDto(data, total, pagination.page, pagination.limit);
  }

  async findOne(id: string): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id },
      relations: ['userDepartments', 'userDepartments.user'],
    });
    if (!department) {
      throw new NotFoundException(`Department ${id} not found`);
    }
    return department;
  }

  async findByCode(code: string): Promise<Department | null> {
    return this.departmentRepository.findOne({ where: { code } });
  }

  async assignUser(dto: AssignUserDepartmentDto): Promise<UserDepartment> {
    const existing = await this.userDepartmentRepository.findOne({
      where: { userId: dto.userId, departmentId: dto.departmentId },
    });
    if (existing) {
      throw new ConflictException('User is already assigned to this department');
    }

    const assignment = this.userDepartmentRepository.create({
      userId: dto.userId,
      departmentId: dto.departmentId,
      title: dto.title || null,
      isPrimary: dto.isPrimary || false,
    });

    return this.userDepartmentRepository.save(assignment);
  }

  async getUserDepartmentIds(userId: string): Promise<string[]> {
    const assignments = await this.userDepartmentRepository.find({
      where: { userId },
      select: ['departmentId'],
    });
    return assignments.map((a) => a.departmentId);
  }

  async isUserInDepartment(userId: string, departmentId: string): Promise<boolean> {
    const count = await this.userDepartmentRepository.count({
      where: { userId, departmentId },
    });
    return count > 0;
  }
}
