import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { AuditLog } from './audit-log.entity';
import { Attachment } from './attachment.entity';

export enum ExpenseCategory {
  TRAVEL = 'TRAVEL',
  FUEL = 'FUEL',
  INTERNET = 'INTERNET',
  MEALS = 'MEALS',
  EQUIPMENT = 'EQUIPMENT',
  OTHER = 'OTHER',
}

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RETURNED_FOR_CHANGES = 'RETURNED_FOR_CHANGES',
}

@Entity({ name: 'applications' })
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({
    type: 'simple-enum',
    enum: ExpenseCategory,
  })
  category: ExpenseCategory;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'date', name: 'expense_date', nullable: true })
  expenseDate: string | null;

  @Column({ type: 'varchar', name: 'attachment_url', nullable: true })
  attachmentUrl: string;

  @Column({
    type: 'simple-enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.DRAFT,
  })
  status: ApplicationStatus;

  @Column({ name: 'applicant_id' })
  applicantId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicant_id' })
  applicant: User;

  @OneToMany(() => AuditLog, (auditLog) => auditLog.application)
  auditLogs: AuditLog[];

  @OneToOne(() => Attachment, (attachment) => attachment.application, { cascade: true, nullable: true })
  attachment: Attachment;
}
