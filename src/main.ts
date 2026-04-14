import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security
  app.use(helmet());
  app.enableCors();

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
}
bootstrap();
