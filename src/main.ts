import { webcrypto } from 'node:crypto';

// Polyfill for crypto if it's not global (required for @nestjs/typeorm in Node.js < 19)
if (!global.crypto) {
  Object.defineProperty(global, 'crypto', {
    value: webcrypto,
    writable: true,
    configurable: true,
  });
}

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as path from 'path';
import { AppModule } from './app.module';
import { UploadsService } from './uploads/uploads.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security
  app.use(
    helmet({
      // Allow loading images served from this same origin in the app
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors({
    origin: [
      'https://rafeeq-dashboard.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
  });

  // Serve uploaded files as static assets at /static
  const uploadsDir = path.join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsDir, { prefix: '/static' });

  // Ensure upload directories exist
  const uploadsService = app.get(UploadsService);
  uploadsService.ensureDirectories();

  // Global prefix
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Rafeeq Al-Khalil (رفيق الخليل)')
    .setDescription(
      'Smart Municipal Complaints Platform for Hebron Municipality. ' +
      'Manages citizen complaints, AI-based image analysis, automatic routing, ' +
      'department assignments, and municipality-wide analytics.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication and registration')
    .addTag('Users', 'User management')
    .addTag('Departments', 'Municipality department management')
    .addTag('Complaints', 'Complaint submission and lifecycle')
    .addTag('Comments', 'Complaint comments')
    .addTag('Assignments', 'Complaint assignment management')
    .addTag('AI Analysis', 'AI image analysis results')
    .addTag('Notifications', 'User notifications')
    .addTag('Reports', 'Analytics and reporting')
    .addTag('Uploads', 'File upload endpoints')
    .addTag('Health', 'Health checks')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = configService.get<number>('app.port', 3000);
  await app.listen(port);
  logger.log(`Rafeeq Al-Khalil API running on port ${port}`);
  logger.log(`Swagger docs available at http://localhost:${port}/docs`);
  logger.log(`Static files available at http://localhost:${port}/static`);
}
bootstrap();
