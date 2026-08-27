import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { SeederService } from './seeder.service';
import { User, UserSchema } from '../modules/users/schemas/user.schema';

let memoryServer: MongoMemoryServer | null = null;
const logger = new Logger('DatabaseModule');

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const defaultUri = configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/chatapp');

        // Test if default MongoDB / Docker / Atlas is reachable
        try {
          const mongoose = await import('mongoose');
          const conn = await mongoose.createConnection(defaultUri, { serverSelectionTimeoutMS: 1500 }).asPromise();
          await conn.close();
          logger.log(`🚀 Connected to MongoDB at: ${defaultUri}`);
          return { uri: defaultUri };
        } catch {
          logger.warn('⚠️ Local/Docker MongoDB not detected. Starting Embedded Persistent MongoDB Engine...');
          if (!memoryServer) {
            const dataDir = path.resolve(process.cwd(), '.data/db');
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }
            try {
              memoryServer = await MongoMemoryServer.create({
                instance: {
                  dbPath: dataDir,
                  storageEngine: 'wiredTiger',
                  dbName: 'chatapp',
                },
              });
            } catch (initErr) {
              logger.warn(`Fallback to standard memory server: ${initErr.message}`);
              memoryServer = await MongoMemoryServer.create({
                instance: {
                  dbName: 'chatapp',
                },
              });
            }
          }
          const memoryUri = memoryServer.getUri();
          logger.log(`🚀 Connected to Persistent Local MongoDB Engine: ${memoryUri}`);
          return { uri: memoryUri };
        }
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [SeederService],
  exports: [MongooseModule],
})
export class DatabaseModule {}
