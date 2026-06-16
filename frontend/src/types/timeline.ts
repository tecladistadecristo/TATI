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

export interface TimelineRecord {
  id: string;

  user_id: string;
  child_id: string;

  author_name?: string;
  author_role?: string;

  event_type: TimelineEventType;

  mood?: string;
  sleep_quality?: string;

  description: string;

  observation_alert?: string;
  ai_summary?: string;

  created_at: string;
  updated_at?: string;
}

export interface CreateTimelineRecord {
  child_id: string;

  author_name?: string;
  author_role?: string;

  event_type: TimelineEventType;

  mood?: string;
  sleep_quality?: string;

  description: string;
}