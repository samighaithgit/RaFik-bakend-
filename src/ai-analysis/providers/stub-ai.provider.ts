import { Injectable, Logger } from '@nestjs/common';
import {
  IAiProvider,
  AiAnalysisInput,
  AiAnalysisResult,
} from './ai-provider.interface';
import { ComplaintCategory } from '../../common/enums';

/**
 * Stub AI provider for development and testing.
 * Returns deterministic results based on simple keyword matching.
 *
 * Replace with a real provider (OpenAI, Claude, etc.) in production
 * by swapping the AI_PROVIDER binding in AiAnalysisModule.
 */
@Injectable()
export class StubAiProvider implements IAiProvider {
  private readonly logger = new Logger(StubAiProvider.name);

  private readonly keywordCategoryMap: Record<string, ComplaintCategory> = {
    'streetlight': ComplaintCategory.ELECTRICITY,
    'light': ComplaintCategory.ELECTRICITY,
    'كهرباء': ComplaintCategory.ELECTRICITY,
    'إنارة': ComplaintCategory.ELECTRICITY,
    'water': ComplaintCategory.WATER,
    'leak': ComplaintCategory.WATER,
    'مياه': ComplaintCategory.WATER,
    'تسرب': ComplaintCategory.WATER,
    'sewage': ComplaintCategory.SEWAGE,
    'مجاري': ComplaintCategory.SEWAGE,
    'road': ComplaintCategory.ROADS,
    'pothole': ComplaintCategory.ROADS,
    'شارع': ComplaintCategory.ROADS,
    'حفرة': ComplaintCategory.ROADS,
    'garbage': ComplaintCategory.SANITATION,
    'trash': ComplaintCategory.SANITATION,
    'قمامة': ComplaintCategory.SANITATION,
    'نفايات': ComplaintCategory.SANITATION,
    'pollution': ComplaintCategory.ENVIRONMENT,
    'تلوث': ComplaintCategory.ENVIRONMENT,
  };

  private readonly categoryDeptMap: Record<ComplaintCategory, string> = {
    [ComplaintCategory.ELECTRICITY]: 'ELECTRICITY',
    [ComplaintCategory.WATER]: 'WATER',
    [ComplaintCategory.SEWAGE]: 'SEWAGE',
    [ComplaintCategory.ROADS]: 'ROADS',
    [ComplaintCategory.SANITATION]: 'SANITATION',
    [ComplaintCategory.ENVIRONMENT]: 'ENVIRONMENT',
    [ComplaintCategory.PUBLIC_CLEANLINESS]: 'SANITATION',
    [ComplaintCategory.OTHER]: 'ENVIRONMENT',
  };

  getModelName(): string {
    return 'stub-keyword-matcher-v1';
  }

  async analyzeComplaint(input: AiAnalysisInput): Promise<AiAnalysisResult> {
    this.logger.log(`[Stub] Analyzing complaint ${input.complaintId}`);

    const text = `${input.title || ''} ${input.description || ''}`.toLowerCase();
    let predictedCategory: ComplaintCategory = ComplaintCategory.OTHER;
    let rawLabel = 'unclassified';
    let confidence = 0.3;

    for (const [keyword, category] of Object.entries(this.keywordCategoryMap)) {
      if (text.includes(keyword.toLowerCase())) {
        predictedCategory = category;
        rawLabel = keyword;
        confidence = 0.75;
        break;
      }
    }

    const suggestedDepartmentCode = this.categoryDeptMap[predictedCategory] || null;

    return {
      rawLabel,
      predictedCategory,
      generatedDescription: `[Stub AI] Detected issue type: ${predictedCategory}. Based on text analysis of "${text.substring(0, 80)}..."`,
      suggestedDepartmentCode,
      confidenceScore: confidence,
      severityScore: 0.5,
      repeatLikelihoodScore: 0.2,
      rawPayload: {
        provider: 'stub',
        inputText: text.substring(0, 200),
        imageCount: input.imageUrls.length,
        voiceNoteCount: input.voiceNoteUrls.length,
        matchedKeyword: rawLabel,
      },
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}
