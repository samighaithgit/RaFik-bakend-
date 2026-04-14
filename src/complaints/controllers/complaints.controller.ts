import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ComplaintsService } from '../services/complaints.service';
import { CreateComplaintDto } from '../dto/create-complaint.dto';
import { UpdateComplaintStatusDto } from '../dto/update-complaint-status.dto';
import { FilterComplaintsDto } from '../dto/filter-complaints.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';
import { User } from '../../users/entities/user.entity';
import { DepartmentsService } from '../../departments/departments.service';

@ApiTags('Complaints')
@ApiBearerAuth()
@Controller('complaints')
export class ComplaintsController {
  constructor(
    private readonly complaintsService: ComplaintsService,
    private readonly departmentsService: DepartmentsService,
  ) {}

  @Post()
  @Roles(Role.CITIZEN, Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Submit a new complaint' })
  create(@Body() dto: CreateComplaintDto, @CurrentUser() user: User) {
    return this.complaintsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List complaints (scoped by user role)' })
  async findAll(
    @Query() filters: FilterComplaintsDto,
    @CurrentUser() user: User,
  ) {
    const departmentIds = await this.departmentsService.getUserDepartmentIds(user.id);
    return this.complaintsService.findAll(filters, user, departmentIds);
  }

  @Get('reference/:ref')
  @ApiOperation({ summary: 'Get complaint by reference number' })
  @ApiParam({ name: 'ref', example: 'HBR-20260414-A3BX9K' })
  findByReference(@Param('ref') ref: string) {
    return this.complaintsService.findByReference(ref);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get complaint by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.complaintsService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(
    Role.DEPARTMENT_STAFF,
    Role.DEPARTMENT_MANAGER,
    Role.MUNICIPAL_ADMIN,
    Role.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Update complaint status' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateComplaintStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.complaintsService.updateStatus(id, dto, user);
  }
}
