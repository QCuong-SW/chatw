import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../modules/users/schemas/user.schema';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeederService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async onApplicationBootstrap() {
    const count = await this.userModel.countDocuments();
    if (count === 0) {
      this.logger.log('🌱 Seeding initial test accounts...');

      const defaultPassword = 'password123';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      const testUsers = [
        {
          displayName: 'Alice Nguyen',
          username: 'alice',
          email: 'alice@example.com',
          phoneNumber: '0901234567',
          passwordHash,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
          bio: 'Frontend Engineer & React Enthusiast 🚀',
          customStatus: 'Available 🟢',
        },
        {
          displayName: 'Bob Tran',
          username: 'bob',
          email: 'bob@example.com',
          phoneNumber: '0902345678',
          passwordHash,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
          bio: 'Backend Ninja (NestJS + Redis) ⚡',
          customStatus: 'Coding 💻',
        },
        {
          displayName: 'Charlie Le',
          username: 'charlie',
          email: 'charlie@example.com',
          phoneNumber: '0903456789',
          passwordHash,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
          bio: 'UI/UX Designer & Motion Artist ✨',
          customStatus: 'Designing 🎨',
        },
        {
          displayName: 'David Pham',
          username: 'david',
          email: 'david@example.com',
          phoneNumber: '0904567890',
          passwordHash,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
          bio: 'DevOps & Cloud Architect ☁️',
          customStatus: 'Deploying 🚀',
        },
      ];

      for (const u of testUsers) {
        await this.userModel.create(u);
        this.logger.log(`🌱 Seeded Test Account: ${u.email} / ${u.phoneNumber} (password: ${defaultPassword})`);
      }
    }
  }
}
