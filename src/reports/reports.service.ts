import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaint } from '../complaints/entities/complaint.entity';
import { ComplaintLocation } from '../complaints/entities/complaint-location.entity';
import { ReportFiltersDto } from './dto/report-filters.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Complaint)
    private readonly complaintRepository: Repository<Complaint>,
    @InjectRepository(ComplaintLocation)
    private readonly locationRepository: Repository<ComplaintLocation>,
  ) {}

  async getComplaintsByCategory(filters: ReportFiltersDto) {
    const qb = this.complaintRepository
      .createQueryBuilder('c')
      .select('c.category', 'category')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('c.category')
      .orderBy('count', 'DESC');

    this.applyDateFilters(qb, filters);

    return qb.getRawMany();
  }

  async getComplaintsByDepartment(filters: ReportFiltersDto) {
    const qb = this.complaintRepository
      .createQueryBuilder('c')
      .leftJoin('c.department', 'd')
      .select('d.id', 'departmentId')
      .addSelect('d.name', 'departmentName')
      .addSelect('d.code', 'departmentCode')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('d.id')
      .addGroupBy('d.name')
      .addGroupBy('d.code')
      .orderBy('count', 'DESC');

    this.applyDateFilters(qb, filters);

    return qb.getRawMany();
  }

  async getComplaintsByArea(filters: ReportFiltersDto) {
    const qb = this.complaintRepository
      .createQueryBuilder('c')
      .innerJoin('c.location', 'loc')
      .select('loc.neighborhood', 'neighborhood')
      .addSelect('loc.area_name', 'areaName')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('loc.neighborhood')
      .addGroupBy('loc.area_name')
      .orderBy('count', 'DESC')
      .limit(50);

    this.applyDateFilters(qb, filters);
    if (filters.category) {
      qb.andWhere('c.category = :category', { category: filters.category });
    }

    return qb.getRawMany();
  }

  async getAverageResolutionTime(filters: ReportFiltersDto) {
    const qb = this.complaintRepository
      .createQueryBuilder('c')
      .select(
        `AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.submitted_at)) / 3600)`,
        'avgResolutionHours',
      )
      .addSelect(
        `AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.submitted_at)) / 86400)`,
        'avgResolutionDays',
      )
      .addSelect('COUNT(*)::int', 'resolvedCount')
      .where('c.resolved_at IS NOT NULL')
      .andWhere('c.submitted_at IS NOT NULL');

    this.applyDateFilters(qb, filters);

    return qb.getRawOne();
  }

  async getResolutionTimeByDepartment(filters: ReportFiltersDto) {
    const qb = this.complaintRepository
      .createQueryBuilder('c')
      .leftJoin('c.department', 'd')
      .select('d.id', 'departmentId')
      .addSelect('d.name', 'departmentName')
      .addSelect(
        `AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.submitted_at)) / 3600)`,
        'avgResolutionHours',
      )
      .addSelect('COUNT(*)::int', 'resolvedCount')
      .where('c.resolved_at IS NOT NULL')
      .groupBy('d.id')
      .addGroupBy('d.name')
      .orderBy('"avgResolutionHours"', 'ASC');

    this.applyDateFilters(qb, filters);

    return qb.getRawMany();
  }

  async getUnresolvedBacklog(filters: ReportFiltersDto) {
    const qb = this.complaintRepository
      .createQueryBuilder('c')
      .select('c.status', 'status')
      .addSelect('c.priority', 'priority')
      .addSelect('COUNT(*)::int', 'count')
      .where('c.status NOT IN (:...resolvedStatuses)', {
        resolvedStatuses: ['RESOLVED', 'CLOSED', 'REJECTED', 'DUPLICATE'],
      })
      .groupBy('c.status')
      .addGroupBy('c.priority')
      .orderBy('count', 'DESC');

    if (filters.departmentId) {
      qb.andWhere('c.departmentId = :departmentId', {
        departmentId: filters.departmentId,
      });
    }

    return qb.getRawMany();
  }

  async getRepeatedIssuesByNeighborhood(filters: ReportFiltersDto) {
    const qb = this.complaintRepository
      .createQueryBuilder('c')
      .innerJoin('c.location', 'loc')
      .select('loc.neighborhood', 'neighborhood')
      .addSelect('c.category', 'category')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('loc.neighborhood')
      .addGroupBy('c.category')
      .having('COUNT(*) >= 2')
      .orderBy('count', 'DESC')
      .limit(100);

    this.applyDateFilters(qb, filters);

    return qb.getRawMany();
  }

  async getDensityMapData(filters: ReportFiltersDto) {
    const qb = this.locationRepository
      .createQueryBuilder('loc')
      .innerJoin('loc.complaint', 'c')
      .select('loc.latitude', 'latitude')
      .addSelect('loc.longitude', 'longitude')
      .addSelect('c.category', 'category')
      .addSelect('c.priority', 'priority')
      .addSelect('c.status', 'status');

    if (filters.dateFrom) {
      qb.andWhere('c.submitted_at >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    if (filters.dateTo) {
      qb.andWhere('c.submitted_at <= :dateTo', { dateTo: filters.dateTo });
    }
    if (filters.category) {
      qb.andWhere('c.category = :category', { category: filters.category });
    }

    return qb.getRawMany();
  }

  async getInfrastructureInvestmentReport(filters: ReportFiltersDto) {
    const qb = this.complaintRepository
      .createQueryBuilder('c')
      .leftJoin('c.department', 'd')
      .innerJoin('c.location', 'loc')
      .select('d.id', 'departmentId')
      .addSelect('d.name', 'departmentName')
      .addSelect('loc.neighborhood', 'neighborhood')
      .addSelect('COUNT(*)::int', 'complaintCount')
      .addSelect(
        `SUM(CASE WHEN c.priority IN ('HIGH','CRITICAL') THEN 1 ELSE 0 END)::int`,
        'highSeverityCount',
      )
      .addSelect(
        `SUM(CASE WHEN c.is_duplicate = true THEN 1 ELSE 0 END)::int`,
        'duplicateCount',
      )
      .groupBy('d.id')
      .addGroupBy('d.name')
      .addGroupBy('loc.neighborhood')
      .orderBy('"complaintCount"', 'DESC')
      .limit(50);

    this.applyDateFilters(qb, filters);

    return qb.getRawMany();
  }

  async getDashboardSummary(filters: ReportFiltersDto) {
    const [
      totalComplaints,
      statusBreakdown,
      categoryBreakdown,
      avgResolution,
    ] = await Promise.all([
      this.getTotalCount(filters),
      this.getStatusBreakdown(filters),
      this.getComplaintsByCategory(filters),
      this.getAverageResolutionTime(filters),
    ]);

    return {
      totalComplaints,
      statusBreakdown,
      categoryBreakdown,
      avgResolution,
    };
  }

  private async getTotalCount(filters: ReportFiltersDto): Promise<number> {
    const qb = this.complaintRepository.createQueryBuilder('c');
    this.applyDateFilters(qb, filters);
    return qb.getCount();
  }

  private async getStatusBreakdown(filters: ReportFiltersDto) {
    const qb = this.complaintRepository
      .createQueryBuilder('c')
      .select('c.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('c.status')
      .orderBy('count', 'DESC');

    this.applyDateFilters(qb, filters);

    return qb.getRawMany();
  }

  private applyDateFilters(qb: any, filters: ReportFiltersDto): void {
    if (filters.dateFrom) {
      qb.andWhere('c.submitted_at >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    if (filters.dateTo) {
      qb.andWhere('c.submitted_at <= :dateTo', { dateTo: filters.dateTo });
    }
    if (filters.departmentId) {
      qb.andWhere('c.department_id = :departmentId', {
        departmentId: filters.departmentId,
      });
    }
  }
}
