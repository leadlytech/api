import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { setupGracefulShutdown } from 'nestjs-graceful-shutdown';
import * as compression from 'compression';
import helmet from 'helmet';

import { AppModule } from './modules/app/module.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  setupGracefulShutdown({ app });

  if (process.env.DEFAULT_SERVICE_VERSION) {
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: process.env.DEFAULT_SERVICE_VERSION,
    });
  }

  if (process.env.CORS_ENABLED === 'true') {
    app.enableCors({
      origin: process.env.CORS_ORIGIN,
      methods: process.env.CORS_METHODS,
      credentials: process.env.CORS_CREDENTIALS === 'true',
    });
  }

  app.use(compression());
  app.use(helmet());

  const configService = app.get<ConfigService>(ConfigService);

  await app.listen(
    configService.get<number>('SERVER_PORT', {
      infer: true,
    }),
  );
}
bootstrap();
