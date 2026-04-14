import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ComplaintsService } from './complaints.service';
import { ComplaintRoutingService } from './complaint-routing.service';
import { Complaint } from '../entities/complaint.entity';
import { ComplaintImage } from '../entities/complaint-image.entity';
import { ComplaintLocation } from '../entities/complaint-location.entity';
import { ComplaintStatusHistory } from '../entities/complaint-status-history.entity';
import { User } from '../../users/entities/user.entity';
import {
  ComplaintCategory,
  ComplaintStatus,
  Priority,
  Role,
} from '../../common/enums';

describe('ComplaintsService', () => {
  let service: ComplaintsService;
  let complaintRepo: any;
  let routingService: any;

  const mockCitizen: Partial<User> = {
    id: '22222222-2222-2222-2222-222222222222',
    fullName: 'Test Citizen',
    email: 'citizen@test.com',
    role: Role.CITIZEN,
  };

  const mockDepartment = {
    id: '33333333-3333-3333-3333-333333333333',
    code: 'ELECTRICITY',
    name: 'Electricity Department',
  };

  beforeEach(async () => {
    complaintRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    routingService = {
      generateReferenceNumber: jest.fn().mockReturnValue('HBR-20260414-ABC123'),
      determineInitialPriority: jest.fn().mockReturnValue(Priority.MEDIUM),
      routeToDepartment: jest.fn().mockResolvedValue(mockDepartment),
      checkForNearbyDuplicates: jest.fn().mockResolvedValue({
        isDuplicate: false,
        duplicateOfId: null,
      }),
    };

    // Mock DataSource transaction
    const mockManager = {
      create: jest.fn().mockImplementation((_entity: any, data: any) => data),
      save: jest.fn().mockImplementation((_entity: any, data: any) => ({
        id: 'new-complaint-id',
        ...data,
      })),
      getRepository: jest.fn().mockReturnValue(complaintRepo),
    };

    const mockDataSource = {
      transaction: jest.fn().mockImplementation(async (cb: any) => {
        return cb(mockManager);
      }),
    };

    // After transaction, findOne is called to return full complaint
    complaintRepo.findOne.mockResolvedValue({
      id: 'new-complaint-id',
      referenceNumber: 'HBR-20260414-ABC123',
      citizenId: mockCitizen.id,
      status: ComplaintStatus.SUBMITTED,
      category: ComplaintCategory.ELECTRICITY,
      priority: Priority.MEDIUM,
      departmentId: mockDepartment.id,
      department: mockDepartment,
      location: { latitude: 31.5326, longitude: 35.0998 },
      images: [],
      statusHistory: [],
      assignments: [],
      aiAnalyses: [],
      comments: [],
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplaintsService,
        { provide: getRepositoryToken(Complaint), useValue: complaintRepo },
        { provide: getRepositoryToken(ComplaintImage), useValue: {} },
        { provide: getRepositoryToken(ComplaintLocation), useValue: {} },
        { provide: getRepositoryToken(ComplaintStatusHistory), useValue: {} },
        { provide: ComplaintRoutingService, useValue: routingService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<ComplaintsService>(ComplaintsService);
  });

  describe('create', () => {
    it('should create a complaint with routing and location', async () => {
      const result = await service.create(
        {
          title: 'Broken streetlight',
          description: 'The streetlight on King Faisal is out',
          category: ComplaintCategory.ELECTRICITY,
          location: { latitude: 31.5326, longitude: 35.0998 },
        },
        mockCitizen as User,
      );

      expect(result.referenceNumber).toBe('HBR-20260414-ABC123');
      expect(result.departmentId).toBe(mockDepartment.id);
      expect(routingService.routeToDepartment).toHaveBeenCalledWith(
        ComplaintCategory.ELECTRICITY,
      );
      expect(routingService.determineInitialPriority).toHaveBeenCalledWith(
        ComplaintCategory.ELECTRICITY,
      );
      expect(routingService.checkForNearbyDuplicates).toHaveBeenCalled();
    });

    it('should detect duplicates when nearby complaint exists', async () => {
      routingService.checkForNearbyDuplicates.mockResolvedValue({
        isDuplicate: true,
        duplicateOfId: 'existing-complaint-id',
      });

      await service.create(
        {
          category: ComplaintCategory.WATER,
          location: { latitude: 31.5326, longitude: 35.0998 },
        },
        mockCitizen as User,
      );

      expect(routingService.checkForNearbyDuplicates).toHaveBeenCalled();
    });
  });
});
