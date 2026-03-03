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
  contact_phone?: string | null;
  situation?: string | null;
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
