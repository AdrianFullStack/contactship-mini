import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LeadController } from './controllers/lead.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './models/lead.entity';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { LeadRepository } from './repositories/lead.repository';
import { LeadsService } from './services/lead.service';
import { RedisModule } from './modules/redis.module';
import { RedisRepository } from './repositories/redis.repository';
import { SyncService } from './services/sync.service';
import { AIProcessor } from './processors/ia.processor';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true
    }),
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        level: config.get<string>('LOG_LEVEL', 'info'),
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
        transports: [new winston.transports.Console()],
      }),
    }),
    // Configuración TypeORM (Postgres/Supabase)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const password = (config.get<string>('DATABASE_PASSWORD', '') ?? '').trim();

        return {
          type: 'postgres',
          host: config.get<string>('DATABASE_HOST'),
          port: config.get<number>('DATABASE_PORT', 3306),
          username: config.get<string>('DATABASE_USER'),
          password,
          database: config.get<string>('DATABASE_NAME'),
          autoLoadEntities: false,
          entities: [Lead],
          synchronize: config.get<boolean>('DATABASE_SYNCHRONIZE', false),
          retryAttempts: 10,
          retryDelay: 3000,
          keepConnectionAlive: true,
          charset: 'utf8mb4_unicode_ci',
          extra: {
            connectTimeout: 10_000,
          },
        };
      },
    }),
    TypeOrmModule.forFeature([Lead]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    BullModule.registerQueueAsync({
      name: 'ai-processing',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        redis: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    RedisModule
  ],
  controllers: [AppController, LeadController],
  providers: [
    SyncService,
    AIProcessor,
    {
      provide: 'ILeadService',
      useClass: LeadsService,
    },
    {
      provide: 'ILeadRepository',
      useClass: LeadRepository,
    },
    {
      provide: 'IRedisRepository',
      useClass: RedisRepository,
    },
    AppService
  ],
})
export class AppModule {}
