import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user: any): ExecutionContext {
    return {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
        getResponse: () => ({}),
        getNext: () => jest.fn(),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ role: Role.CITIZEN });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      Role.MUNICIPAL_ADMIN,
      Role.SUPER_ADMIN,
    ]);
    const context = createMockContext({ role: Role.SUPER_ADMIN });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user lacks required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      Role.SUPER_ADMIN,
      Role.MUNICIPAL_ADMIN,
    ]);
    const context = createMockContext({ role: Role.CITIZEN });
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny CITIZEN access to DEPARTMENT_MANAGER-only routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      Role.DEPARTMENT_MANAGER,
    ]);
    const context = createMockContext({ role: Role.CITIZEN });
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow DEPARTMENT_STAFF access to staff-allowed routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      Role.DEPARTMENT_STAFF,
      Role.DEPARTMENT_MANAGER,
      Role.MUNICIPAL_ADMIN,
      Role.SUPER_ADMIN,
    ]);
    const context = createMockContext({ role: Role.DEPARTMENT_STAFF });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when no user on request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.CITIZEN]);
    const context = createMockContext(null);
    expect(guard.canActivate(context)).toBe(false);
  });
});
