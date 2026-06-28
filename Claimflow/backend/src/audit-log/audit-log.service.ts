import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AuditLog } from '../database/entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async logTransition(
    applicationId: string,
    userId: string,
    oldStatus: string | null,
    newStatus: string,
    comment?: string,
    manager?: EntityManager,
  ): Promise<AuditLog> {
    const repository = manager?.getRepository(AuditLog) || this.auditLogRepository;
    const log = repository.create({
      applicationId,
      userId,
      oldStatus,
      newStatus,
      comment: comment || null,
    });
    return repository.save(log);
  }

  async getLogsForApplication(applicationId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { applicationId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });
  }
}
