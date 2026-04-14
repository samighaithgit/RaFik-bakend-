import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { AssignUserDepartmentDto } from './dto/assign-user-department.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.MUNICIPAL_ADMIN)
  @ApiOperation({ summary: 'Create a new department' })
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all departments' })
  findAll(@Query() pagination: PaginationDto) {
    return this.departmentsService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.departmentsService.findOne(id);
  }

  @Post('assign-user')
  @Roles(Role.SUPER_ADMIN, Role.MUNICIPAL_ADMIN, Role.DEPARTMENT_MANAGER)
  @ApiOperation({ summary: 'Assign a user to a department' })
  assignUser(@Body() dto: AssignUserDepartmentDto) {
    return this.departmentsService.assignUser(dto);
  }
}
