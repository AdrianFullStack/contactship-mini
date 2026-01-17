import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { Lead } from 'src/models/lead.entity';
import { REDIS_CLIENT } from 'src/modules/redis.module';

@Injectable()
export class RedisRepository {
    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redisClient: Redis,
    ) {}
    
    async save(lead: Lead): Promise<void> {
        const cacheKey = `lead:uuid:${lead.id}`;
        await this.redisClient.set(
            cacheKey,
            JSON.stringify(lead),
            'EX',
            3600 // 1 hour expiration
        );
    }

    async findById(id: string): Promise<Object | null> {
        const cacheKey = `lead:uuid:${id}`;
        const data = await this.redisClient.get(cacheKey);
        return data ? JSON.parse(data) : null;
    }
}