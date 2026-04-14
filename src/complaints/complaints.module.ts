import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Complaint } from './entities/complaint.entity';
import { ComplaintImage } from './entities/complaint-image.entity';
import { ComplaintVoiceNote } from './entities/complaint-voice-note.entity';
import { ComplaintLocation } from './entities/complaint-location.entity';
import { ComplaintComment } from './entities/complaint-comment.entity';
import { ComplaintStatusHistory } from './entities/complaint-status-history.entity';
import { ComplaintsService } from './services/complaints.service';
import { ComplaintRoutingService } from './services/complaint-routing.service';
import { ComplaintsController } from './controllers/complaints.controller';
import { CommentsController } from './controllers/comments.controller';
import { CommentsService } from './services/comments.service';
import { DepartmentsModule } from '../departments/departments.module';
import { Department } from '../departments/entities/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Complaint,
      ComplaintImage,
      ComplaintVoiceNote,
      ComplaintLocation,
      ComplaintComment,
      ComplaintStatusHistory,
      Department,
    ]),
    DepartmentsModule,
  ],
  providers: [ComplaintsService, ComplaintRoutingService, CommentsService],
  controllers: [ComplaintsController, CommentsController],
  exports: [ComplaintsService, ComplaintRoutingService],
})
export class ComplaintsModule {}
