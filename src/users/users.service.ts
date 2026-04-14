import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      phoneNumber: dto.phoneNumber || null,
      passwordHash,
      role: dto.role,
    });

    return this.userRepository.save(user);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResponseDto<User>> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (pagination.sortBy) {
      queryBuilder.orderBy(
        `user.${pagination.sortBy}`,
        pagination.sortOrder || 'DESC',
      );
    } else {
      queryBuilder.orderBy('user.createdAt', 'DESC');
    }

    const [data, total] = await queryBuilder
      .skip(pagination.skip)
      .take(pagination.limit)
      .getManyAndCount();

    return new PaginatedResponseDto(data, total, pagination.page, pagination.limit);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['userDepartments', 'userDepartments.department'],
    });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = false;
    return this.userRepository.save(user);
  }
}
