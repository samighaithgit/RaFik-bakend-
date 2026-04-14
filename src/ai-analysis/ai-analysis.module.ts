import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiAnalysisService } from './ai-analysis.service';
import { AiAnalysisController } from './ai-analysis.controller';
import { AiAnalysis } from './entities/ai-analysis.entity';
import { Complaint } from '../complaints/entities/complaint.entity';
import { Department } from '../departments/entities/department.entity';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import { OpenAiProvider } from './providers/openai-ai.provider';
import { StubAiProvider } from './providers/stub-ai.provider';
import { ComplaintCreatedListener } from './listeners/complaint-created.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiAnalysis, Complaint, Department]),
    ConfigModule,
  ],
  providers: [
    AiAnalysisService,
    ComplaintCreatedListener,
    OpenAiProvider,
    StubAiProvider,
    {
      provide: AI_PROVIDER,
      useFactory: (
        configService: ConfigService,
        openaiProvider: OpenAiProvider,
        stubProvider: StubAiProvider,
      ) => {
        const logger = new Logger('AiAnalysisModule');
        const apiKey = configService.get<string>('openai.apiKey');
        if (apiKey) {
          logger.log('Using OpenAI provider for AI analysis');
          return openaiProvider;
        }
        logger.warn(
          'OPENAI_API_KEY not configured — falling back to Stub AI provider',
        );
        return stubProvider;
      },
      inject: [ConfigService, OpenAiProvider, StubAiProvider],
    },
  ],
  controllers: [AiAnalysisController],
  exports: [AiAnalysisService],
})
export class AiAnalysisModule {}
