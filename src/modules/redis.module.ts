import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

// Token para inyectar Redis donde quieras
export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global() // Global para no importarlo en todos lados
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          // password: configService.get('REDIS_PASSWORD'), // En basic tier GCP no hay pass
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}