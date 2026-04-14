import { ComplaintStatus } from '../../common/enums';

/**
 * Event names used across the complaint lifecycle.
 * Used with @nestjs/event-emitter for decoupled AI analysis,
 * notifications, and future integrations.
 */
export const COMPLAINT_EVENTS = {
  CREATED: 'complaint.created',
  STATUS_CHANGED: 'complaint.status.changed',
  ASSIGNED: 'complaint.assigned',
  AI_ANALYSIS_COMPLETED: 'complaint.ai.analysis.completed',
} as const;

export class ComplaintCreatedEvent {
  constructor(
    public readonly complaintId: string,
    public readonly referenceNumber: string,
    public readonly citizenId: string,
    public readonly imageUrls: string[],
    public readonly voiceNoteUrls: string[],
    public readonly title: string | null,
    public readonly description: string | null,
    public readonly latitude: number | null,
    public readonly longitude: number | null,
    public readonly neighborhood: string | null,
  ) {}
}

export class ComplaintStatusChangedEvent {
  constructor(
    public readonly complaintId: string,
    public readonly referenceNumber: string,
    public readonly citizenId: string,
    public readonly oldStatus: ComplaintStatus | null,
    public readonly newStatus: ComplaintStatus,
    public readonly changedByUserId: string | null,
  ) {}
}

export class AiAnalysisCompletedEvent {
  constructor(
    public readonly complaintId: string,
    public readonly analysisId: string,
    public readonly predictedCategory: string | null,
    public readonly suggestedDepartmentCode: string | null,
    public readonly confidenceScore: number | null,
  ) {}
}
