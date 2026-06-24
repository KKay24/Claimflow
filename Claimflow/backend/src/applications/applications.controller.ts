import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReqUser } from '../auth/decorators/user.decorator';
import { UserRole } from '../database/entities/user.entity';
import { ApplicationStatus } from '../database/entities/application.entity';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { TransitionCommentDto } from './dto/transition-comment.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // ==========================================
  // APPLICANT ENDPOINTS
  // ==========================================

  @Get('applications/my')
  @Roles(UserRole.APPLICANT)
  async getMyApplications(@ReqUser('id') userId: string) {
    return this.applicationsService.getMyApplications(userId);
  }

  @Get('applications/:id')
  @Roles(UserRole.APPLICANT)
  async applicantGetOne(
    @ReqUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.applicationsService.applicantGetOne(userId, id);
  }

  @Post('applications')
  @Roles(UserRole.APPLICANT)
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @ReqUser('id') userId: string,
    @Body() createDto: CreateApplicationDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.applicationsService.create(userId, createDto, file);
  }

  @Patch('applications/:id')
  @Roles(UserRole.APPLICANT)
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @ReqUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateApplicationDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.applicationsService.update(userId, id, updateDto, file);
  }

  @Post('applications/:id/submit')
  @Roles(UserRole.APPLICANT)
  @HttpCode(HttpStatus.OK)
  async submit(
    @ReqUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.applicationsService.executeTransition(
      userId,
      UserRole.APPLICANT,
      id,
      ApplicationStatus.SUBMITTED,
    );
  }

  @Post('applications/:id/draft')
  @Roles(UserRole.APPLICANT)
  @HttpCode(HttpStatus.OK)
  async transitionToDraft(
    @ReqUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.applicationsService.executeTransition(
      userId,
      UserRole.APPLICANT,
      id,
      ApplicationStatus.DRAFT,
    );
  }

  // ==========================================
  // REVIEWER ENDPOINTS
  // ==========================================

  @Get('reviewer/applications')
  @Roles(UserRole.REVIEWER)
  async reviewerGetAll(@Query('status') status?: ApplicationStatus) {
    return this.applicationsService.reviewerGetAll(status);
  }

  @Get('reviewer/applications/:id')
  @Roles(UserRole.REVIEWER)
  async reviewerGetOne(@Param('id') id: string) {
    return this.applicationsService.reviewerGetOne(id);
  }

  @Post('reviewer/applications/:id/start-review')
  @Roles(UserRole.REVIEWER)
  @HttpCode(HttpStatus.OK)
  async startReview(
    @ReqUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.applicationsService.executeTransition(
      userId,
      UserRole.REVIEWER,
      id,
      ApplicationStatus.UNDER_REVIEW,
    );
  }

  @Post('reviewer/applications/:id/approve')
  @Roles(UserRole.REVIEWER)
  @HttpCode(HttpStatus.OK)
  async approve(
    @ReqUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.applicationsService.executeTransition(
      userId,
      UserRole.REVIEWER,
      id,
      ApplicationStatus.APPROVED,
    );
  }

  @Post('reviewer/applications/:id/reject')
  @Roles(UserRole.REVIEWER)
  @HttpCode(HttpStatus.OK)
  async reject(
    @ReqUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: TransitionCommentDto,
  ) {
    return this.applicationsService.executeTransition(
      userId,
      UserRole.REVIEWER,
      id,
      ApplicationStatus.REJECTED,
      body.comment,
    );
  }

  @Post('reviewer/applications/:id/return')
  @Roles(UserRole.REVIEWER)
  @HttpCode(HttpStatus.OK)
  async returnForChanges(
    @ReqUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: TransitionCommentDto,
  ) {
    return this.applicationsService.executeTransition(
      userId,
      UserRole.REVIEWER,
      id,
      ApplicationStatus.RETURNED_FOR_CHANGES,
      body.comment,
    );
  }
}
