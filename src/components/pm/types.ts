// SecondBrain v2.5 types

export interface Ticket {
  id: number;
  ticket_key: string;
  title: string;
  title_clean?: string;
  status: string;
  priority: string | null;
  client_key: string | null;
  client_display_name: string | null;
  sender_name: string | null;
  sender_email: string | null;
  readiness_signal: string | null;
  readiness_score: number | null;
  trust_signal: string | null;
  trust_score: number | null;
  expectation_signal: string | null;
  constraint_signal: string | null;
  decision_signal: string | null;
  decision_label?: string | null;
  decision_detail?: string | null;
  lifecycle_status: string | null;
  appointment_at: string | null;
  due_date: string | null;
  needs_response: number;
  created_at: string | null;
  last_updated: string | null;
  notes_count: number;
  visit_datetime: string | null;
  situation?: string | null;
  // Dispatch fields
  assigned_to?: string | null;
  assigned_by?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  client_address?: string | null;
  effective_visit_time?: string | null;
  deduce_status?: string | null;
  deduced_at?: string | null;
}

export interface CalendarEvent {
  id: number;
  ticket_id: number | null;
  ticket_key: string | null;
  title: string;
  starts_at_raw: string | null;
  starts_at_iso_utc: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  status: string;
  client_name: string | null;
  ticket_title: string | null;
  decision_label: string | null;
}

export interface Client {
  id: number;
  client_key: string;
  display_name: string;
  ticket_count: number;
  open_tickets: number;
  removed_tickets: number;
  last_ticket_date: string | null;
  last_task_type: string | null;
  equipment_notes: string | null;
  contact_notes: string | null;
  access_notes: string | null;
  trust_history_score: number;
}

export interface Summary {
  total_open: number;
  declining_trust_count: number;
  today_count: number;
  signals: Record<string, number>;
  readiness: { high: number; medium: number; low: number };
  last_updated: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'table' | 'brief';
  timestamp: Date;
}

export interface TicketContext {
  asset_hostname:            string | null;
  situation?:                string | null;
  situation_source?:         string | null;
  asset_type:                string | null;
  assigned_to:               string | null;
  assigned_by:               string | null;
  appointment_datetime:      string | null;
  primary_issue:             string | null;
  issue_category:            string | null;
  impact_level:              string | null;
  emotion_tone:              string | null;
  clinical_workflow_impact:  boolean;
  business_risk_summary:     string | null;
  expectation?:              string | null;
  constraints?:              string | null;
  risk_flags?:               string[] | string | null;
  ingestion_version:         number;
  last_ingested_at:          string | null;
}
export interface TicketSignals {
  urgency_score:    number;
  readiness_score:  number;
  trust_score:      number;
  friction_score:   number;
  readiness_signal?: string | null;
  trust_signal?:     string | null;
  computed_at:      string;
}

export interface TicketContextResponse {
  context:          TicketContext | null;
  signals:          TicketSignals | null;
  situation?:       string | null;
  situation_source?: string | null;
}

// ── Today-as-Briefs types (Phase 1) ──────────────────────────────────────────

export interface WorkingBriefSummary {
  brief_id: string;
  ticket_key: string;
  workspace_id: string;
  status: string;
  ticket_status: string;
  client_key: string | null;
  client_display_name: string | null;
  ticket_title: string | null;
  refresh_status: string | null;
  refresh_trigger: string | null;
  confidence: number | null;
  notes_since_refresh: number;
  last_refreshed_at: string | null;
  last_updated: string | null;
  created_at: string | null;
  situation: string | null;
  expectation: string | null;
  constraints: string | null;
  intel_link_count: number;
}

export type JsonArrayish<T> = T[] | string | null | undefined;

export interface WorkingBriefDetail extends WorkingBriefSummary {
  context_summary: string | null;
  resolution_direction: string | null;
  follow_up_items: JsonArrayish<string>;
  risk_flags: JsonArrayish<string>;
  missing_context_flags: JsonArrayish<string>;
  intel_snapshot: string | null;
  refresh_error: string | null;
}

export interface ClientBriefGroup {
  client_key: string;
  client_display_name: string;
  open_brief_count: number;
  stale_count: number;
  last_updated: string | null;
}

export interface ClientStoryTimeline {
  brief_id: string | null;
  ticket_key: string;
  outcome_type: string | null;
  issue_category: string | null;
  impact_level: string | null;
  trust_at_close: number | null;
  confidence: string | null;
  missing_context_flags: JsonArrayish<string>;
  ai_generated: boolean;
  closed_at: string | null;
  ai_close_note_scrubbed: string | null;
}

export interface ClientStorySummaryTrust {
  avg_at_open: number | null;
  avg_at_close: number | null;
  delta: number | null;
  trend: 'improving' | 'declining' | 'stable' | 'unknown' | null;
  latest: number | null;
  min_in_window: number | null;
}

export interface ClientStorySummary {
  total_briefs: number;
  outcome_distribution: { resolved: number; mitigated: number; at_risk: number; escalated: number };
  open_risk_count: number;
  trust: ClientStorySummaryTrust;
  expectation_drift: { met: number; unmet: number; shifted: number; unknown: number };
  confidence_distribution: { high: number; standard: number; low: number; incomplete: number };
  low_confidence_count: number;
}

export interface ClientStoryIssuePatterns {
  category_counts: Array<{ category: string; count: number }>;
  recurring_categories: string[];
  impact_distribution: { high: number; medium: number; low: number };
  emotion_distribution: Record<string, number>;
  asset_type_counts: Array<{ type: string; count: number }>;
  asset_hostname_counts: Array<{ hostname: string; count: number }>;
}

export interface ClientStoryRiskIndicators {
  unresolved_briefs: Array<{
    brief_id: string;
    ticket_key: string;
    outcome_type: string;
    issue_category: string | null;
    impact_level: string | null;
    closed_at: string | null;
  }>;
  missing_context_pattern_counts: Record<string, number>;
  high_emotion_count: number;
  risk_flag_summary: string[];
}

export interface ClientStory {
  client_key: string;
  client_display_name: string | null;
  generated_at: string;
  window_days: number;
  window_from: string;
  window_to: string;
  data_quality: 'empty' | 'thin' | 'usable';
  has_pre_fcb_history: boolean;
  summary: ClientStorySummary;
  issue_patterns: ClientStoryIssuePatterns;
  risk_indicators: ClientStoryRiskIndicators;
  timeline: ClientStoryTimeline[];
}

export interface ClosedBriefSummary {
  brief_id: string;
  ticket_key: string;
  primary_issue: string | null;
  outcome_type: string | null;
  closed_at: string | null;
  confidence: number | null;
  issue_category: string | null;
  impact_level: string | null;
  trust_at_open: string | null;
  trust_at_close: string | null;
  client_display_name: string | null;
}
