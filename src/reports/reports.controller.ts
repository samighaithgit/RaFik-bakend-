import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportFiltersDto } from './dto/report-filters.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@Roles(Role.SUPER_ADMIN, Role.MUNICIPAL_ADMIN, Role.DEPARTMENT_MANAGER)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard summary with key metrics' })
  getDashboard(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getDashboardSummary(filters);
  }

  @Get('by-category')
  @ApiOperation({ summary: 'Complaints count by category' })
  byCategory(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getComplaintsByCategory(filters);
  }

  @Get('by-department')
  @ApiOperation({ summary: 'Complaints count by department' })
  byDepartment(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getComplaintsByDepartment(filters);
  }

  @Get('by-area')
  @ApiOperation({ summary: 'Complaints count by neighborhood / area' })
  byArea(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getComplaintsByArea(filters);
  }

  @Get('avg-resolution-time')
  @ApiOperation({ summary: 'Average complaint resolution time' })
  avgResolutionTime(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getAverageResolutionTime(filters);
  }

  @Get('resolution-by-department')
  @ApiOperation({ summary: 'Average resolution time per department' })
  resolutionByDepartment(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getResolutionTimeByDepartment(filters);
  }

  @Get('backlog')
  @ApiOperation({ summary: 'Unresolved complaint backlog by status and priority' })
  backlog(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getUnresolvedBacklog(filters);
  }

  @Get('repeated-issues')
  @ApiOperation({ summary: 'Repeated issue patterns by neighborhood and category' })
  repeatedIssues(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getRepeatedIssuesByNeighborhood(filters);
  }

  @Get('density-map')
  @ApiOperation({ summary: 'Complaint geolocation data for map visualization' })
  densityMap(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getDensityMapData(filters);
  }

  @Get('infrastructure-investment')
  @ApiOperation({
    summary:
      'Areas needing infrastructure investment based on complaint density and severity',
  })
  infrastructureInvestment(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getInfrastructureInvestmentReport(filters);
  }
}
