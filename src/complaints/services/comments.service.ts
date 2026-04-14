import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplaintComment } from '../entities/complaint-comment.entity';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../common/enums';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(ComplaintComment)
    private readonly commentRepository: Repository<ComplaintComment>,
  ) {}

  async create(dto: CreateCommentDto, user: User): Promise<ComplaintComment> {
    const comment = this.commentRepository.create({
      complaintId: dto.complaintId,
      userId: user.id,
      body: dto.body,
      isInternal: dto.isInternal || false,
    });
    return this.commentRepository.save(comment);
  }

  async findByComplaint(
    complaintId: string,
    currentUser: User,
  ): Promise<ComplaintComment[]> {
    const qb = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.complaintId = :complaintId', { complaintId })
      .orderBy('comment.createdAt', 'ASC');

    // Citizens cannot see internal comments
    if (currentUser.role === Role.CITIZEN) {
      qb.andWhere('comment.isInternal = false');
    }

    return qb.getMany();
  }
}
