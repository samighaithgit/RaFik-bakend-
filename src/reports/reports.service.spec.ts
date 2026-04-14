import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { Complaint } from '../complaints/entities/complaint.entity';
import { ComplaintLocation } from '../complaints/entities/complaint-location.entity';

describe('ReportsService', () => {
  let service: ReportsService;
  let complaintRepo: any;
  let locationRepo: any;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
    getRawOne: jest.fn(),
    getCount: jest.fn(),
  };

  beforeEach(async () => {
    complaintRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({ ...mockQueryBuilder }),
    };
    locationRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({ ...mockQueryBuilder }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Complaint), useValue: complaintRepo },
        { provide: getRepositoryToken(ComplaintLocation), useValue: locationRepo },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  describe('getComplaintsByCategory', () => {
    it('should return category breakdown', async () => {
      const expected = [
        { category: 'ELECTRICITY', count: 42 },
        { category: 'WATER', count: 28 },
        { category: 'ROADS', count: 15 },
      ];

      const qb = complaintRepo.createQueryBuilder();
      qb.getRawMany.mockResolvedValue(expected);

      const result = await service.getComplaintsByCategory({});

      expect(result).toEqual(expected);
      expect(complaintRepo.createQueryBuilder).toHaveBeenCalledWith('c');
    });
  });

  describe('getComplaintsByDepartment', () => {
    it('should return department breakdown', async () => {
      const expected = [
        { departmentId: 'dept-1', departmentName: 'Electricity', count: 42 },
      ];

      const qb = complaintRepo.createQueryBuilder();
      qb.getRawMany.mockResolvedValue(expected);

      const result = await service.getComplaintsByDepartment({});

      expect(result).toEqual(expected);
    });
  });

  describe('getAverageResolutionTime', () => {
    it('should return avg resolution time', async () => {
      const expected = {
        avgResolutionHours: 48.5,
        avgResolutionDays: 2.02,
        resolvedCount: 120,
      };

      const qb = complaintRepo.createQueryBuilder();
      qb.getRawOne.mockResolvedValue(expected);

      const result = await service.getAverageResolutionTime({});

      expect(result).toEqual(expected);
    });
  });

  describe('getDashboardSummary', () => {
    it('should aggregate dashboard metrics', async () => {
      const qb = complaintRepo.createQueryBuilder();
      qb.getRawMany.mockResolvedValue([]);
      qb.getRawOne.mockResolvedValue({ avgResolutionHours: 24 });
      qb.getCount.mockResolvedValue(100);

      const result = await service.getDashboardSummary({});

      expect(result).toHaveProperty('totalComplaints');
      expect(result).toHaveProperty('statusBreakdown');
      expect(result).toHaveProperty('categoryBreakdown');
      expect(result).toHaveProperty('avgResolution');
    });
  });
});
