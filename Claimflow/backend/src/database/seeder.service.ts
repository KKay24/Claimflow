import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DatabaseSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeederService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Checking database seeding...');
    await this.seedUsers();
  }

  private async seedUsers() {
    const defaultUsers = [
      {
        email: 'applicant@test.com',
        name: 'John Applicant',
        role: UserRole.APPLICANT,
        password: 'password123',
      },
      {
        email: 'reviewer@test.com',
        name: 'Sarah Reviewer',
        role: UserRole.REVIEWER,
        password: 'password123',
      },
    ];

    for (const u of defaultUsers) {
      const existingUser = await this.userRepository.findOne({
        where: { email: u.email },
      });

      if (!existingUser) {
        this.logger.log(`Seeding user: ${u.email}`);
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(u.password, saltRounds);

        const newUser = this.userRepository.create({
          email: u.email,
          name: u.name,
          role: u.role,
          passwordHash,
        });

        await this.userRepository.save(newUser);
        this.logger.log(`Seeded user: ${u.email} successfully.`);
      } else {
        this.logger.log(`User already exists: ${u.email}`);
      }
    }
  }
}
