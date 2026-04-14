import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Complaint } from '../complaints/entities/complaint.entity';
import { ComplaintLocation } from '../complaints/entities/complaint-location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Complaint, ComplaintLocation])],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
