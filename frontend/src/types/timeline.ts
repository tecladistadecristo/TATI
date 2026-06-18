export type TimelineEventType =
  | "observacao"
  | "crise"
  | "sono"
  | "alimentacao"
  | "escola"
  | "saude"
  | "medicacao"
  | "conquista"
  | "comportamento";

export type TimelineImportanceLevel =
  | "rotina"
  | "atencao"
  | "importante";

export type TimelineObservedArea =
  | "comunicacao"
  | "comportamento"
  | "escola"
  | "alimentacao"
  | "sono"
  | "saude"
  | "socializacao"
  | "autonomia";

export interface TimelineRecord {
  id: string;
  user_id: string;
  child_id: string;

  author_name?: string | null;
  author_role?: string | null;

  event_type: TimelineEventType;
  observed_area?: TimelineObservedArea | null;
  importance_level?: TimelineImportanceLevel | null;

  mood?: string | null;
  sleep_quality?: string | null;

  description: string;

  observation_alert?: string | null;
  ai_summary?: string | null;

  created_at: string;
  updated_at?: string | null;
}

export interface CreateTimelineRecord {
  child_id: string;

  author_name?: string;
  author_role?: string;

  event_type: TimelineEventType;
  observed_area?: TimelineObservedArea;
  importance_level?: TimelineImportanceLevel;

  mood?: string;
  sleep_quality?: string;

  description: string;
}