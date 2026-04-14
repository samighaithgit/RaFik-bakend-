import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let jwtService: any;

  const mockUser: Partial<User> = {
    id: '11111111-1111-1111-1111-111111111111',
    fullName: 'Test Citizen',
    email: 'test@example.com',
    passwordHash: '',
    role: Role.CITIZEN,
    isActive: true,
    lastLoginAt: null,
  };

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash('TestPassword123', 12);
    mockUser.passwordHash = hashedPassword;

    userRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return access token and user data on valid credentials', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser });
      userRepository.save.mockResolvedValue({ ...mockUser });

      const result = await service.login({
        email: 'test@example.com',
        password: 'TestPassword123',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.role).toBe(Role.CITIZEN);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should throw UnauthorizedException on invalid email', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'wrong@example.com', password: 'whatever' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser });

      await expect(
        service.login({ email: 'test@example.com', password: 'WrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(
        service.login({ email: 'test@example.com', password: 'TestPassword123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create a new citizen and return token', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockImplementation((data: any) => ({ id: 'new-id', ...data }));
      userRepository.save.mockImplementation((user: any) => ({
        ...user,
        id: 'new-id',
        role: Role.CITIZEN,
      }));

      const result = await service.register({
        fullName: 'New Citizen',
        email: 'new@example.com',
        password: 'Password123!',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe('new@example.com');
      expect(userRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.register({
          fullName: 'Duplicate',
          email: 'test@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
