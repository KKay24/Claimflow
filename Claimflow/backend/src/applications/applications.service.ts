import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from '../database/entities/application.entity';
import { UserRole } from '../database/entities/user.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationStateMachineService } from '../state-machine/state-machine.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { FileUploadService } from '../file-upload/file-upload.service';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    private stateMachineService: ApplicationStateMachineService,
    private auditLogService: AuditLogService,
    private fileUploadService: FileUploadService,
  ) {}

  async create(
    userId: string,
    createDto: CreateApplicationDto,
    file?: Express.Multer.File,
  ): Promise<Application> {
    const application = this.applicationRepository.create({
      ...createDto,
      status: ApplicationStatus.DRAFT,
      applicantId: userId,
    });

    const savedApp = await this.applicationRepository.save(application);

    // If an attachment is uploaded, save it
    if (file) {
      const attachment = await this.fileUploadService.saveAttachment(file, savedApp.id);
      savedApp.attachmentUrl = attachment.fileUrl;
      savedApp.attachment = attachment;
      await this.applicationRepository.save(savedApp);
    }

    // Log the initial DRAFT status
    await this.auditLogService.logTransition(
      savedApp.id,
      userId,
      null,
      ApplicationStatus.DRAFT,
      'Claim created as draft',
    );

    return savedApp;
  }

  async update(
    userId: string,
    applicationId: string,
    updateDto: UpdateApplicationDto,
    file?: Express.Multer.File,
  ): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: { attachment: true },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Security Check: Only applicant can edit, and only their own claims
    if (application.applicantId !== userId) {
      throw new ForbiddenException('You are not allowed to edit this application');
    }

    // Business Constraint: Can only edit while status is DRAFT
    if (application.status !== ApplicationStatus.DRAFT) {
      throw new BadRequestException('You can only edit applications that are in DRAFT status');
    }

    // Update fields
    Object.assign(application, updateDto);

    if (file) {
      const attachment = await this.fileUploadService.saveAttachment(file, application.id);
      application.attachmentUrl = attachment.fileUrl;
      application.attachment = attachment;
    }

    return this.applicationRepository.save(application);
  }

  async getMyApplications(userId: string): Promise<Application[]> {
    return this.applicationRepository.find({
      where: { applicantId: userId },
      relations: { attachment: true },
      order: { createdAt: 'DESC' },
    });
  }

  async applicantGetOne(userId: string, applicationId: string): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: { attachment: true },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.applicantId !== userId) {
      throw new ForbiddenException('Forbidden resource');
    }

    // Fetch audit logs timeline
    application.auditLogs = await this.auditLogService.getLogsForApplication(applicationId);

    return application;
  }

  async reviewerGetAll(status?: ApplicationStatus): Promise<Application[]> {
    const query = this.applicationRepository
      .createQueryBuilder('app')
      .leftJoinAndSelect('app.applicant', 'applicant')
      .leftJoinAndSelect('app.attachment', 'attachment')
      .select([
        'app.id',
        'app.title',
        'app.category',
        'app.description',
        'app.amount',
        'app.status',
        'app.createdAt',
        'app.updatedAt',
        'applicant.id',
        'applicant.name',
        'applicant.email',
        'attachment',
      ]);

    if (status) {
      query.where('app.status = :status', { status });
    }

    query.orderBy('app.createdAt', 'DESC');
    return query.getMany();
  }

  async reviewerGetOne(applicationId: string): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: { attachment: true, applicant: true },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Fetch audit logs timeline
    application.auditLogs = await this.auditLogService.getLogsForApplication(applicationId);

    return application;
  }

  async executeTransition(
    userId: string,
    userRole: UserRole,
    applicationId: string,
    targetStatus: ApplicationStatus,
    comment?: string,
  ): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Security Check for Applicants: can only transition their own applications
    if (userRole === UserRole.APPLICANT && application.applicantId !== userId) {
      throw new ForbiddenException('You are not allowed to perform this action');
    }

    const oldStatus = application.status;

    // State Machine Validation (will throw BadRequestException / ForbiddenException if invalid)
    this.stateMachineService.validateTransition(
      oldStatus,
      targetStatus,
      userRole,
      comment,
    );

    // Apply status change
    application.status = targetStatus;
    const updatedApp = await this.applicationRepository.save(application);

    // Log the transition in Audit Log
    await this.auditLogService.logTransition(
      applicationId,
      userId,
      oldStatus,
      targetStatus,
      comment,
    );

    return updatedApp;
  }
}
