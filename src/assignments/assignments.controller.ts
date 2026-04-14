import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';
import { User } from '../users/entities/user.entity';

@ApiTags('Assignments')
@ApiBearerAuth()
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @Roles(Role.DEPARTMENT_MANAGER, Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new complaint assignment' })
  create(@Body() dto: CreateAssignmentDto, @CurrentUser() user: User) {
    return this.assignmentsService.create(dto, user);
  }

  @Get('complaint/:complaintId')
  @ApiOperation({ summary: 'Get assignments for a complaint' })
  findByComplaint(@Param('complaintId', ParseUUIDPipe) complaintId: string) {
    return this.assignmentsService.findByComplaint(complaintId);
  }

  @Patch(':id')
  @Roles(
    Role.DEPARTMENT_STAFF,
    Role.DEPARTMENT_MANAGER,
    Role.MUNICIPAL_ADMIN,
    Role.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Update assignment status' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.assignmentsService.update(id, dto);
  }
}
