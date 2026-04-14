import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  IAiProvider,
  AiAnalysisInput,
  AiAnalysisResult,
} from './ai-provider.interface';
import { ComplaintCategory } from '../../common/enums';

@Injectable()
export class OpenAiProvider implements IAiProvider {
  private readonly logger = new Logger(OpenAiProvider.name);
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly maxTokens: number;

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('openai.apiKey'),
    });
    this.model = this.configService.get<string>('openai.model', 'gpt-4o');
    this.maxTokens = this.configService.get<number>('openai.maxTokens', 1024);
  }

  getModelName(): string {
    return this.model;
  }

  async analyzeComplaint(input: AiAnalysisInput): Promise<AiAnalysisResult> {
    this.logger.log(
      `[OpenAI] Analyzing complaint ${input.complaintId} with model ${this.model}`,
    );

    const systemPrompt = this.buildSystemPrompt();
    const userContent = this.buildUserContent(input);

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
      });

      const rawText = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawText);

      this.logger.log(
        `[OpenAI] Analysis complete for ${input.complaintId}: category=${parsed.category}`,
      );

      return {
        rawLabel: parsed.category || null,
        predictedCategory: this.mapCategory(parsed.category),
        generatedDescription: parsed.description || null,
        suggestedDepartmentCode: parsed.department || null,
        confidenceScore: this.clampScore(parsed.confidence),
        severityScore: this.clampScore(parsed.severity),
        repeatLikelihoodScore: this.clampScore(parsed.repeat_likelihood),
        rawPayload: {
          provider: 'openai',
          model: this.model,
          parsed,
          usage: response.usage,
          finishReason: response.choices[0]?.finish_reason,
        },
      };
    } catch (error) {
      this.logger.error(
        `[OpenAI] Analysis failed for ${input.complaintId}: ${error.message}`,
      );
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    const apiKey = this.configService.get<string>('openai.apiKey');
    if (!apiKey) {
      this.logger.warn('[OpenAI] API key is not configured');
      return false;
    }
    try {
      await this.client.models.retrieve(this.model);
      return true;
    } catch {
      this.logger.warn(`[OpenAI] Model ${this.model} is not accessible`);
      return false;
    }
  }

  private buildSystemPrompt(): string {
    return `You are an AI assistant for Hebron Municipality's smart complaints platform (Rafeeq Al-Khalil).
Your job is to analyze citizen complaints and classify them accurately.

You MUST respond with a JSON object containing these fields:
{
  "category": one of: "ELECTRICITY", "WATER", "SEWAGE", "ROADS", "SANITATION", "ENVIRONMENT", "PUBLIC_CLEANLINESS", "OTHER",
  "department": the department code matching the category (same as category value),
  "description": a clear professional summary of the complaint in Arabic (2-3 sentences),
  "confidence": a number between 0.0 and 1.0 indicating classification confidence,
  "severity": a number between 0.0 and 1.0 indicating issue severity (1.0 = critical),
  "repeat_likelihood": a number between 0.0 and 1.0 indicating likelihood this is a recurring issue
}

Category definitions:
- ELECTRICITY: streetlights, power outages, electrical poles, cables
- WATER: water leaks, supply issues, water quality, pipe breaks
- SEWAGE: sewer overflows, drainage, blocked drains, wastewater
- ROADS: potholes, road damage, sidewalks, traffic signs, road markings
- SANITATION: garbage collection, waste containers, dumpsters
- ENVIRONMENT: pollution, noise, illegal dumping, environmental hazards
- PUBLIC_CLEANLINESS: street cleaning, public spaces, graffiti, abandoned items
- OTHER: anything that doesn't fit the above categories

Be accurate, analyze context carefully, and support both Arabic and English complaints.`;
  }

  private buildUserContent(input: AiAnalysisInput): string {
    const parts: string[] = [];

    parts.push('Analyze this municipal complaint:\n');

    if (input.title) {
      parts.push(`Title: ${input.title}`);
    }
    if (input.description) {
      parts.push(`Description: ${input.description}`);
    }
    if (input.neighborhood) {
      parts.push(`Neighborhood: ${input.neighborhood}`);
    }
    if (input.latitude && input.longitude) {
      parts.push(`Location: ${input.latitude}, ${input.longitude}`);
    }
    if (input.imageUrls.length > 0) {
      parts.push(`Attached images: ${input.imageUrls.length} image(s)`);
    }
    if (input.voiceNoteUrls.length > 0) {
      parts.push(`Attached voice notes: ${input.voiceNoteUrls.length} recording(s)`);
    }

    return parts.join('\n');
  }

  private mapCategory(raw: string | undefined): ComplaintCategory | null {
    if (!raw) return null;
    const upper = raw.toUpperCase();
    return Object.values(ComplaintCategory).includes(upper as ComplaintCategory)
      ? (upper as ComplaintCategory)
      : null;
  }

  private clampScore(value: unknown): number | null {
    if (typeof value !== 'number' || isNaN(value)) return null;
    return Math.max(0, Math.min(1, value));
  }
}
