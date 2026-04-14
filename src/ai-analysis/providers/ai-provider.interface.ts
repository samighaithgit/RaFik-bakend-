import { ComplaintCategory } from '../../common/enums';

/**
 * Result returned by any AI provider after analyzing a complaint.
 */
export interface AiAnalysisResult {
  /** Raw label from the AI model */
  rawLabel: string | null;
  /** Mapped complaint category */
  predictedCategory: ComplaintCategory | null;
  /** AI-generated description of the issue */
  generatedDescription: string | null;
  /** Suggested department code (e.g. 'ELECTRICITY') */
  suggestedDepartmentCode: string | null;
  /** Confidence in prediction (0.0 - 1.0) */
  confidenceScore: number | null;
  /** Severity assessment (0.0 - 1.0) */
  severityScore: number | null;
  /** Likelihood of repeated issue (0.0 - 1.0) */
  repeatLikelihoodScore: number | null;
  /** Full raw response payload for auditing */
  rawPayload: Record<string, unknown> | null;
}

/**
 * Input context passed to AI providers for analysis.
 */
export interface AiAnalysisInput {
  complaintId: string;
  /** Image URLs attached to the complaint */
  imageUrls: string[];
  /** Voice note URLs attached to the complaint */
  voiceNoteUrls: string[];
  /** Citizen description text */
  description: string | null;
  /** Citizen title */
  title: string | null;
  /** GPS latitude */
  latitude: number | null;
  /** GPS longitude */
  longitude: number | null;
  /** Neighborhood name if known */
  neighborhood: string | null;
}

/**
 * Abstract interface for all AI providers.
 * Implement this to add OpenAI, Claude, Google Vision, or any custom model.
 *
 * Usage:
 *   1. Create a class that implements IAiProvider
 *   2. Register it with the AI_PROVIDER injection token
 *   3. The AiAnalysisListener will automatically use it
 */
export interface IAiProvider {
  /** Human-readable model name (e.g. 'gpt-4-vision', 'claude-3.5-sonnet') */
  getModelName(): string;

  /** Analyze a complaint and return structured results */
  analyzeComplaint(input: AiAnalysisInput): Promise<AiAnalysisResult>;

  /** Check if the provider is properly configured and reachable */
  isAvailable(): Promise<boolean>;
}

/**
 * Injection token for the AI provider.
 * Use @Inject(AI_PROVIDER) to inject the active provider.
 */
export const AI_PROVIDER = Symbol('AI_PROVIDER');
