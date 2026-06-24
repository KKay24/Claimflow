import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';
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

const entities = [User, Application, AuditLog, Attachment];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const dbType = configService.get<string>('DB_TYPE') || 'postgres';
        const synchronize = configService.get<string>('DB_SYNCHRONIZE') !== 'false';

        if (dbType === 'sqlite' || dbType === 'better-sqlite3') {
          return {
            type: 'better-sqlite3',
            database: configService.get<string>('DB_DATABASE') || 'claimflow.sqlite',
            entities,
            synchronize,
          };
        }

        return {
          type: 'postgres' as const,
          host: configService.get<string>('DB_HOST') || 'localhost',
          port: Number(configService.get<number>('DB_PORT') || 5432),
          username: configService.get<string>('DB_USERNAME') || 'postgres',
          password: configService.get<string>('DB_PASSWORD') || 'password',
          database: configService.get<string>('DB_DATABASE') || 'claimflow',
          entities,
          synchronize,
        };
      },
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
