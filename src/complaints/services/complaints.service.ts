import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Complaint } from '../entities/complaint.entity';
import { ComplaintImage } from '../entities/complaint-image.entity';
import { ComplaintVoiceNote } from '../entities/complaint-voice-note.entity';
import { ComplaintLocation } from '../entities/complaint-location.entity';
import { ComplaintStatusHistory } from '../entities/complaint-status-history.entity';
import { CreateComplaintDto } from '../dto/create-complaint.dto';
import { UpdateComplaintStatusDto } from '../dto/update-complaint-status.dto';
import { FilterComplaintsDto } from '../dto/filter-complaints.dto';
import { ComplaintRoutingService } from './complaint-routing.service';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import {
  COMPLAINT_EVENTS,
  ComplaintCreatedEvent,
  ComplaintStatusChangedEvent,
} from '../events/complaint-events';
import {
  ComplaintStatus,
  ComplaintCategory,
  Role,
} from '../../common/enums';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class ComplaintsService {
  private readonly logger = new Logger(ComplaintsService.name);

  constructor(
    @InjectRepository(Complaint)
    private readonly complaintRepository: Repository<Complaint>,
    @InjectRepository(ComplaintImage)
    private readonly imageRepository: Repository<ComplaintImage>,
    @InjectRepository(ComplaintVoiceNote)
    private readonly voiceNoteRepository: Repository<ComplaintVoiceNote>,
    @InjectRepository(ComplaintLocation)
    private readonly locationRepository: Repository<ComplaintLocation>,
    @InjectRepository(ComplaintStatusHistory)
    private readonly statusHistoryRepository: Repository<ComplaintStatusHistory>,
    private readonly routingService: ComplaintRoutingService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateComplaintDto, citizen: User): Promise<Complaint> {
    const savedComplaint = await this.dataSource.transaction(async (manager) => {
      const category = dto.category || ComplaintCategory.OTHER;
      const referenceNumber = this.routingService.generateReferenceNumber();
      const priority = this.routingService.determineInitialPriority(category);

      // Route to department
      const department = await this.routingService.routeToDepartment(category);

      // Check for duplicates
      const duplicateCheck = await this.routingService.checkForNearbyDuplicates(
        dto.location.latitude,
        dto.location.longitude,
        category,
        manager.getRepository(Complaint),
      );

      // Create complaint
      const complaint = manager.create(Complaint, {
        referenceNumber,
        citizenId: citizen.id,
        title: dto.title || null,
        description: dto.description || null,
        category,
        subcategory: dto.subcategory || null,
        status: ComplaintStatus.SUBMITTED,
        priority,
        source: dto.source,
        manuallyEnteredAddress: dto.manuallyEnteredAddress || null,
        departmentId: department?.id || null,
        aiSuggestedDepartmentId: null,
        assignedBySystem: !!department,
        isDuplicate: duplicateCheck.isDuplicate,
        duplicateOfComplaintId: duplicateCheck.duplicateOfId,
        submittedAt: new Date(),
      });

      const result = await manager.save(Complaint, complaint);

      // Create location
      const location = manager.create(ComplaintLocation, {
        complaintId: result.id,
        latitude: dto.location.latitude,
        longitude: dto.location.longitude,
        accuracyMeters: dto.location.accuracyMeters || null,
        neighborhood: dto.location.neighborhood || null,
        areaName: dto.location.areaName || null,
        streetName: dto.location.streetName || null,
      });
      await manager.save(ComplaintLocation, location);

      // Create images
      if (dto.images?.length) {
        const images = dto.images.map((img, idx) =>
          manager.create(ComplaintImage, {
            complaintId: result.id,
            imageUrl: img.imageUrl,
            imageMimeType: img.imageMimeType || null,
            imageSize: img.imageSize || null,
            sortOrder: img.sortOrder ?? idx,
          }),
        );
        await manager.save(ComplaintImage, images);
      }

      // Create voice notes
      if (dto.voiceNotes?.length) {
        const voiceNotes = dto.voiceNotes.map((vn, idx) =>
          manager.create(ComplaintVoiceNote, {
            complaintId: result.id,
            voiceUrl: vn.voiceUrl,
            voiceMimeType: vn.voiceMimeType || null,
            fileSize: vn.fileSize || null,
            durationSeconds: vn.durationSeconds || null,
            sortOrder: vn.sortOrder ?? idx,
          }),
        );
        await manager.save(ComplaintVoiceNote, voiceNotes);
      }

      // Create initial status history
      const history = manager.create(ComplaintStatusHistory, {
        complaintId: result.id,
        oldStatus: null,
        newStatus: ComplaintStatus.SUBMITTED,
        changedByUserId: null,
        reason: 'Complaint submitted',
      });
      await manager.save(ComplaintStatusHistory, history);

      this.logger.log(
        `Complaint ${referenceNumber} created by citizen ${citizen.id}, ` +
        `routed to department ${department?.code || 'NONE'}, ` +
        `images: ${dto.images?.length || 0}, voices: ${dto.voiceNotes?.length || 0}, ` +
        `duplicate: ${duplicateCheck.isDuplicate}`,
      );

      return result;
    });

    // Emit event AFTER transaction commits (for AI analysis, notifications, etc.)
    const fullComplaint = await this.findOne(savedComplaint.id);
    this.eventEmitter.emit(
      COMPLAINT_EVENTS.CREATED,
      new ComplaintCreatedEvent(
        fullComplaint.id,
        fullComplaint.referenceNumber,
        fullComplaint.citizenId,
        (fullComplaint.images || []).map((img) => img.imageUrl),
        (fullComplaint.voiceNotes || []).map((vn) => vn.voiceUrl),
        fullComplaint.title,
        fullComplaint.description,
        fullComplaint.location?.latitude || null,
        fullComplaint.location?.longitude || null,
        fullComplaint.location?.neighborhood || null,
      ),
    );

    return fullComplaint;
  }

  async findAll(
    filters: FilterComplaintsDto,
    currentUser: User,
    userDepartmentIds: string[],
  ): Promise<PaginatedResponseDto<Complaint>> {
    const qb = this.complaintRepository
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.location', 'location')
      .leftJoinAndSelect('complaint.department', 'department')
      .leftJoinAndSelect('complaint.citizen', 'citizen')
      .leftJoinAndSelect('complaint.images', 'images')
      .leftJoinAndSelect('complaint.voiceNotes', 'voiceNotes');

    // Scope by role
    if (currentUser.role === Role.CITIZEN) {
      qb.andWhere('complaint.citizenId = :citizenId', { citizenId: currentUser.id });
    } else if (
      currentUser.role === Role.DEPARTMENT_STAFF ||
      currentUser.role === Role.DEPARTMENT_MANAGER
    ) {
      if (userDepartmentIds.length > 0) {
        qb.andWhere('complaint.departmentId IN (:...deptIds)', {
          deptIds: userDepartmentIds,
        });
      } else {
        qb.andWhere('1 = 0');
      }
    }

    // Apply filters
    if (filters.status) {
      qb.andWhere('complaint.status = :status', { status: filters.status });
    }
    if (filters.category) {
      qb.andWhere('complaint.category = :category', { category: filters.category });
    }
    if (filters.priority) {
      qb.andWhere('complaint.priority = :priority', { priority: filters.priority });
    }
    if (filters.departmentId) {
      qb.andWhere('complaint.departmentId = :departmentId', {
        departmentId: filters.departmentId,
      });
    }
    if (filters.citizenId) {
      qb.andWhere('complaint.citizenId = :filterCitizenId', {
        filterCitizenId: filters.citizenId,
      });
    }
    if (filters.neighborhood) {
      qb.andWhere('location.neighborhood ILIKE :neighborhood', {
        neighborhood: `%${filters.neighborhood}%`,
      });
    }
    if (filters.isDuplicate !== undefined) {
      qb.andWhere('complaint.isDuplicate = :isDuplicate', {
        isDuplicate: filters.isDuplicate,
      });
    }
    if (filters.dateFrom) {
      qb.andWhere('complaint.submittedAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    if (filters.dateTo) {
      qb.andWhere('complaint.submittedAt <= :dateTo', { dateTo: filters.dateTo });
    }

    const sortField = filters.sortBy || 'submittedAt';
    const sortOrder = filters.sortOrder || 'DESC';
    qb.orderBy(`complaint.${sortField}`, sortOrder);

    const [data, total] = await qb
      .skip(filters.skip)
      .take(filters.limit)
      .getManyAndCount();

    return new PaginatedResponseDto(data, total, filters.page, filters.limit);
  }

  async findOne(id: string): Promise<Complaint> {
    const complaint = await this.complaintRepository.findOne({
      where: { id },
      relations: [
        'location',
        'images',
        'voiceNotes',
        'department',
        'citizen',
        'statusHistory',
        'assignments',
        'assignments.department',
        'assignments.assignedToUser',
        'aiAnalyses',
        'comments',
        'comments.user',
      ],
    });
    if (!complaint) {
      throw new NotFoundException(`Complaint ${id} not found`);
    }
    return complaint;
  }

  async updateStatus(
    id: string,
    dto: UpdateComplaintStatusDto,
    currentUser: User,
  ): Promise<Complaint> {
    const complaint = await this.findOne(id);
    const oldStatus = complaint.status;

    complaint.status = dto.status;

    if (dto.status === ComplaintStatus.RESOLVED) {
      complaint.resolvedAt = new Date();
    }
    if (dto.status === ComplaintStatus.CLOSED) {
      complaint.closedAt = new Date();
    }

    await this.complaintRepository.save(complaint);

    // Record status change
    const history = this.statusHistoryRepository.create({
      complaintId: id,
      oldStatus,
      newStatus: dto.status,
      changedByUserId: currentUser.id,
      reason: dto.reason || null,
      notes: dto.notes || null,
    });
    await this.statusHistoryRepository.save(history);

    // Emit status changed event
    this.eventEmitter.emit(
      COMPLAINT_EVENTS.STATUS_CHANGED,
      new ComplaintStatusChangedEvent(
        complaint.id,
        complaint.referenceNumber,
        complaint.citizenId,
        oldStatus,
        dto.status,
        currentUser.id,
      ),
    );

    return this.findOne(id);
  }

  async findByReference(referenceNumber: string): Promise<Complaint> {
    const complaint = await this.complaintRepository.findOne({
      where: { referenceNumber },
      relations: ['location', 'images', 'voiceNotes', 'department', 'statusHistory'],
    });
    if (!complaint) {
      throw new NotFoundException(`Complaint with reference ${referenceNumber} not found`);
    }
    return complaint;
  }
}
