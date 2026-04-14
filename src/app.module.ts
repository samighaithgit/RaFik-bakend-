import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { appConfig, databaseConfig, jwtConfig, openaiConfig } from './config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { AiAnalysisModule } from './ai-analysis/ai-analysis.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, openaiConfig],
      envFilePath: ['.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('app.nodeEnv') === 'production';
        const isRunFromDist = __dirname.includes('dist');

        return {
          type: 'postgres',
          host: configService.get<string>('database.host'),
          port: configService.get<number>('database.port'),
          username: configService.get<string>('database.username'),
          password: configService.get<string>('database.password'),
          database: configService.get<string>('database.database'),
          autoLoadEntities: true,
          synchronize: false,
          migrationsRun: true,
          migrations: [isRunFromDist ? 'dist/database/migrations/*.js' : 'src/database/migrations/*.ts'],
          logging: !isProduction,
        };
      },
    }),

    // Event system for decoupled communication
    EventEmitterModule.forRoot(),

    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    DepartmentsModule,
    ComplaintsModule,
    AssignmentsModule,
    AiAnalysisModule,
    NotificationsModule,
    ReportsModule,
    UploadsModule,
  ],
  providers: [
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Global validation pipe
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    },
    // Global JWT auth guard (use @Public() to bypass)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global roles guard
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Global response transformation
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // Global serialization (respects @Exclude on entities)
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector) =>
        new ClassSerializerInterceptor(reflector),
      inject: [Reflector],
    },
  ],
})
export class AppModule {}
