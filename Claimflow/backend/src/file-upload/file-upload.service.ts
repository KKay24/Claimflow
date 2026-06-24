import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from '../database/entities/attachment.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileUploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
  ) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveAttachment(
    file: Express.Multer.File,
    applicationId: string,
  ): Promise<Attachment> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileExt = path.extname(file.originalname);
    const uniqueFilename = `${applicationId}_${Date.now()}${fileExt}`;
    const filePath = path.join(this.uploadDir, uniqueFilename);

    try {
      fs.writeFileSync(filePath, file.buffer);
    } catch (error) {
      throw new BadRequestException('Failed to save file locally');
    }

    // Relative URL to access the file
    const fileUrl = `/uploads/${uniqueFilename}`;

    // Create or update attachment metadata
    let attachment = await this.attachmentRepository.findOne({
      where: { applicationId },
    });

    if (attachment) {
      // Remove old file if it exists
      const oldFilePath = path.join(this.uploadDir, path.basename(attachment.fileUrl));
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (e) {
          // Ignore delete failure of old file
        }
      }
      attachment.fileName = file.originalname;
      attachment.fileUrl = fileUrl;
      attachment.mimeType = file.mimetype;
      attachment.fileSize = file.size;
    } else {
      attachment = this.attachmentRepository.create({
        applicationId,
        fileName: file.originalname,
        fileUrl,
        mimeType: file.mimetype,
        fileSize: file.size,
      });
    }

    return this.attachmentRepository.save(attachment);
  }

  async getAttachmentForApplication(applicationId: string): Promise<Attachment | null> {
    return this.attachmentRepository.findOne({ where: { applicationId } });
  }
}
