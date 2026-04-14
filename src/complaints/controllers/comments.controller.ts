import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from '../services/comments.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

@ApiTags('Comments')
@ApiBearerAuth()
@Controller('complaints/:complaintId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a comment to a complaint' })
  create(
    @Param('complaintId', ParseUUIDPipe) complaintId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: User,
  ) {
    dto.complaintId = complaintId;
    return this.commentsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get comments for a complaint' })
  findByComplaint(
    @Param('complaintId', ParseUUIDPipe) complaintId: string,
    @CurrentUser() user: User,
  ) {
    return this.commentsService.findByComplaint(complaintId, user);
  }
}
