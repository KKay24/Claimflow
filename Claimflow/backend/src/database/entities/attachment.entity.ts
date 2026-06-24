import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Application } from './application.entity';

@Entity({ name: 'attachments' })
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'application_id' })
  applicationId: string;

  @Column({ type: 'varchar', name: 'file_name' })
  fileName: string;

  @Column({ type: 'varchar', name: 'file_url' })
  fileUrl: string;

  @Column({ type: 'varchar', name: 'mime_type' })
  mimeType: string;

  @Column({ type: 'integer', name: 'file_size' })
  fileSize: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @OneToOne(() => Application, (application) => application.attachment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;
}
