import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from '../database/entities/application.entity';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { StateMachineModule } from '../state-machine/state-machine.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application]),
    StateMachineModule,
    AuditLogModule,
    FileUploadModule,
    AuthModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
