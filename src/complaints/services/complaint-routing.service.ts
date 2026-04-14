import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../../departments/entities/department.entity';
import { ComplaintCategory, Priority } from '../../common/enums';

/**
 * Routing service that determines department assignment, priority,
 * and duplicate detection for incoming complaints.
 *
 * Currently uses rule-based routing. Designed to be extended
 * with AI-based routing results from the ai-analysis module.
 */
@Injectable()
export class ComplaintRoutingService {
  private readonly logger = new Logger(ComplaintRoutingService.name);

  /** Maps complaint categories to department codes */
  private readonly categoryDepartmentMap: Record<ComplaintCategory, string> = {
    [ComplaintCategory.ELECTRICITY]: 'ELECTRICITY',
    [ComplaintCategory.WATER]: 'WATER',
    [ComplaintCategory.SEWAGE]: 'SEWAGE',
    [ComplaintCategory.ROADS]: 'ROADS',
    [ComplaintCategory.SANITATION]: 'SANITATION',
    [ComplaintCategory.ENVIRONMENT]: 'ENVIRONMENT',
    [ComplaintCategory.PUBLIC_CLEANLINESS]: 'SANITATION',
    [ComplaintCategory.OTHER]: 'ENVIRONMENT',
  };

  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  async routeToDepartment(category: ComplaintCategory): Promise<Department | null> {
    const code = this.categoryDepartmentMap[category];
    if (!code) {
      this.logger.warn(`No department mapping for category: ${category}`);
      return null;
    }

    const department = await this.departmentRepository.findOne({
      where: { code, isActive: true },
    });

    if (!department) {
      this.logger.warn(`Department with code '${code}' not found or inactive`);
    }

    return department;
  }

  determineInitialPriority(category: ComplaintCategory): Priority {
    switch (category) {
      case ComplaintCategory.SEWAGE:
        return Priority.HIGH;
      case ComplaintCategory.WATER:
        return Priority.HIGH;
      case ComplaintCategory.ELECTRICITY:
        return Priority.MEDIUM;
      case ComplaintCategory.ROADS:
        return Priority.MEDIUM;
      case ComplaintCategory.SANITATION:
        return Priority.MEDIUM;
      case ComplaintCategory.ENVIRONMENT:
        return Priority.LOW;
      case ComplaintCategory.PUBLIC_CLEANLINESS:
        return Priority.LOW;
      default:
        return Priority.MEDIUM;
    }
  }

  async checkForNearbyDuplicates(
    latitude: number,
    longitude: number,
    category: ComplaintCategory,
    complaintRepository: Repository<any>,
  ): Promise<{ isDuplicate: boolean; duplicateOfId: string | null }> {
    // Approximate bounding box: ~200 meters radius
    const latDelta = 0.0018;
    const lonDelta = 0.0022;

    const recentCutoff = new Date();
    recentCutoff.setDate(recentCutoff.getDate() - 7);

    const nearbyComplaint = await complaintRepository
      .createQueryBuilder('complaint')
      .innerJoin('complaint.location', 'loc')
      .where('complaint.category = :category', { category })
      .andWhere('complaint.submittedAt >= :cutoff', { cutoff: recentCutoff })
      .andWhere('complaint.status NOT IN (:...closedStatuses)', {
        closedStatuses: ['CLOSED', 'REJECTED', 'DUPLICATE'],
      })
      .andWhere('loc.latitude BETWEEN :latMin AND :latMax', {
        latMin: latitude - latDelta,
        latMax: latitude + latDelta,
      })
      .andWhere('loc.longitude BETWEEN :lonMin AND :lonMax', {
        lonMin: longitude - lonDelta,
        lonMax: longitude + lonDelta,
      })
      .orderBy('complaint.submittedAt', 'DESC')
      .getOne();

    if (nearbyComplaint) {
      this.logger.log(
        `Potential duplicate found: existing complaint ${nearbyComplaint.id} ` +
        `for category ${category} within ~200m`,
      );
      return { isDuplicate: true, duplicateOfId: nearbyComplaint.id };
    }

    return { isDuplicate: false, duplicateOfId: null };
  }

  generateReferenceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `HBR-${year}${month}${day}-${random}`;
  }
}
