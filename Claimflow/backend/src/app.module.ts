import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Entities
import { User } from './database/entities/user.entity';
import { Application } from './database/entities/application.entity';
import { AuditLog } from './database/entities/audit-log.entity';
import { Attachment } from './database/entities/attachment.entity';

// Seeder
import { DatabaseSeederService } from './database/seeder.service';

// Modules
import { AuthModule } from './auth/auth.module';
import { StateMachineModule } from './state-machine/state-machine.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { ApplicationsModule } from './applications/applications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('DB_USERNAME') || 'postgres',
        password: configService.get<string>('DB_PASSWORD') || 'password',
        database: configService.get<string>('DB_DATABASE') || 'claimflow',
        entities: [User, Application, AuditLog, Attachment],
        synchronize: true, // Auto-create schemas during dev
      }),
    }),
    TypeOrmModule.forFeature([User]),
    AuthModule,
    StateMachineModule,
    AuditLogModule,
    FileUploadModule,
    ApplicationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseSeederService],
})
export class AppModule {}
