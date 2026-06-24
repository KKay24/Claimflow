import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from '../database/entities/attachment.entity';
import { FileUploadService } from './file-upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([Attachment])],
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class FileUploadModule {}
