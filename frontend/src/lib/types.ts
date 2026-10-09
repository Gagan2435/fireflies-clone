export interface Participant { id: number; name: string; email?: string | null }
export interface Tag { id: number; name: string }
export interface Speaker { id: number; name: string }

export interface MeetingListItem {
  id: number; title: string; date: string; duration: number;
  platform: 'zoom' | 'meet' | 'teams' | 'upload' | null; source: string;
  participants: Participant[]; tags: Tag[]; overview: string | null;
  open_action_items: number; total_action_items: number;
}
export interface Segment {
  id: number; idx: number; speaker_id: number | null; speaker_name: string | null;
  start_time: number; end_time: number; text: string;
}
export interface Chapter { id: number; title: string; summary: string | null; start_time: number }
export interface KeyPoint { id: number; text: string; start_time: number | null }
export interface ActionItem {
  id: number; meeting_id: number; segment_id: number | null; assignee_id: number | null;
  assignee_name: string | null; text: string; due_date: string | null; completed: boolean; created_at: string;
}
export interface Task extends ActionItem { meeting_title: string; meeting_date: string }
export interface Comment { id: number; meeting_id: number; segment_id: number | null; author_name: string; text: string; created_at: string }
export interface Soundbite { id: number; meeting_id: number; segment_id: number | null; title: string; start_time: number; end_time: number; created_at: string }
export interface MeetingDetail extends MeetingListItem {
  media_url: string | null; speakers: Speaker[]; segments: Segment[]; chapters: Chapter[];
  key_points: KeyPoint[]; keywords: string[]; action_items: ActionItem[]; comments: Comment[]; soundbites: Soundbite[];
}
export interface ChatMessage { id: number; meeting_id: number | null; role: 'user' | 'assistant'; content: string; sources: string[]; created_at: string }
export interface SearchHit {
  meeting_id: number; meeting_title: string; meeting_date: string; kind: 'title' | 'transcript' | 'summary';
  snippet: string; start_time: number | null; segment_id: number | null;
}
export interface SearchResults { query: string; meetings: MeetingListItem[]; hits: SearchHit[] }
export interface Me { id: number; name: string; email: string; plan: string; free_meetings_left: number; storage_used_mb: number; storage_total_mb: number }

export interface MeetingFilters {
  q?: string; participant?: string; tag?: string; date_range?: '' | 'today' | 'week' | 'month' | 'quarter';
  sort_by?: 'recency' | 'duration' | 'title'; order?: 'asc' | 'desc';
}
export interface MeetingCreate {
  title: string; date?: string; duration?: number; platform?: string;
  participants?: { name: string; email?: string }[]; tags?: string[]; transcript_text?: string; filename?: string;
}
