import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  // Fallback in-memory storage if Redis server is not running
  private inMemoryStore = new Map<string, { value: string; expiresAt?: number }>();
  private inMemorySets = new Map<string, Set<string>>();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    try {
      this.client = new Redis({
        host,
        port,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: () => null, // don't retry endlessly if not running
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('🚀 Connected to Redis successfully');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(`⚠️ Redis unavailable: ${err.message} (Using in-memory fallback)`);
      });
    } catch {
      this.isConnected = false;
      this.logger.warn('⚠️ Redis not available. Using In-Memory Fallback store.');
    }
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }

  // Key-value caching
  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch {}
    }
    const item = this.inMemoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.inMemoryStore.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch {}
    }

    this.inMemoryStore.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch {}
    }
    this.inMemoryStore.delete(key);
    this.inMemorySets.delete(key);
  }

  // Presence tracking (Online/Offline)
  async setUserOnline(userId: string, socketId: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.sadd(`user:sockets:${userId}`, socketId);
        await this.client.set(`presence:user:${userId}`, 'ONLINE');
        return;
      } catch {}
    }

    const setKey = `user:sockets:${userId}`;
    if (!this.inMemorySets.has(setKey)) {
      this.inMemorySets.set(setKey, new Set<string>());
    }
    this.inMemorySets.get(setKey)!.add(socketId);
    this.inMemoryStore.set(`presence:user:${userId}`, { value: 'ONLINE' });
  }

  async setUserOffline(userId: string, socketId: string): Promise<boolean> {
    if (this.isConnected && this.client) {
      try {
        await this.client.srem(`user:sockets:${userId}`, socketId);
        const remaining = await this.client.scard(`user:sockets:${userId}`);
        if (remaining === 0) {
          await this.client.del(`presence:user:${userId}`);
          return true;
        }
        return false;
      } catch {}
    }

    const setKey = `user:sockets:${userId}`;
    const sockets = this.inMemorySets.get(setKey);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.inMemorySets.delete(setKey);
        this.inMemoryStore.delete(`presence:user:${userId}`);
        return true;
      }
    }
    return false;
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const status = await this.get(`presence:user:${userId}`);
    return status === 'ONLINE';
  }

  async getAllOnlineUsers(): Promise<string[]> {
    if (this.isConnected && this.client) {
      try {
        const keys = await this.client.keys('presence:user:*');
        return keys.map((k) => k.replace('presence:user:', ''));
      } catch {}
    }

    const keys: string[] = [];
    for (const [key, val] of this.inMemoryStore.entries()) {
      if (key.startsWith('presence:user:') && val.value === 'ONLINE') {
        keys.push(key.replace('presence:user:', ''));
      }
    }
    return keys;
  }
}
