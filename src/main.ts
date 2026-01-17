import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerConfig } from './config/logger.config';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonModule } from 'nest-winston';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger: LoggerConfig = new LoggerConfig();

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(logger.console()),
  });

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
