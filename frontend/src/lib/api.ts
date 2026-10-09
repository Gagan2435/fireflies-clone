import type {
  ActionItem, ChatMessage, Comment, MeetingCreate, MeetingDetail, MeetingFilters, MeetingListItem,
  Me, Participant, SearchResults, Soundbite, Tag, Task,
} from './types';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: isForm ? init?.headers : { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      msg = typeof body.detail === 'string' ? body.detail : body.detail?.[0]?.msg || msg;
    } catch { /* ignore */ }
    throw new ApiError(res.status, msg);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}
const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

export const api = {
  me: () => req<Me>('/me'),
  meetings: (f: MeetingFilters = {}) => {
    const qs = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && qs.append(k, String(v)));
    return req<MeetingListItem[]>(`/meetings?${qs}`);
  },
  meeting: (id: number) => req<MeetingDetail>(`/meetings/${id}`),
  createMeeting: (p: MeetingCreate) => req<MeetingDetail>('/meetings', json('POST', p)),
  uploadTranscript: (file: File, title?: string, participants?: string, tags?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    if (title) fd.append('title', title);
    if (participants) fd.append('participants', participants);
    if (tags) fd.append('tags', tags);
    return req<MeetingDetail>('/meetings/upload', { method: 'POST', body: fd });
  },
  updateMeeting: (id: number, p: { title?: string; participants?: { name: string; email?: string }[]; tags?: string[]; overview?: string }) =>
    req<MeetingDetail>(`/meetings/${id}`, json('PATCH', p)),
  deleteMeeting: (id: number) => req<void>(`/meetings/${id}`, json('DELETE')),
  regenerateNotes: (id: number) => req<MeetingDetail>(`/meetings/${id}/regenerate-notes`, json('POST')),

  tasks: () => req<Task[]>('/tasks'),
  addActionItem: (mid: number, p: { text: string; assignee_name?: string | null; due_date?: string | null }) =>
    req<ActionItem>(`/meetings/${mid}/action-items`, json('POST', p)),
  patchActionItem: (id: number, p: Partial<{ text: string; assignee_name: string | null; due_date: string | null; completed: boolean }>) =>
    req<ActionItem>(`/action-items/${id}`, json('PATCH', p)),
  deleteActionItem: (id: number) => req<void>(`/action-items/${id}`, json('DELETE')),

  addComment: (mid: number, text: string, segment_id?: number) => req<Comment>(`/meetings/${mid}/comments`, json('POST', { text, segment_id })),
  deleteComment: (id: number) => req<void>(`/comments/${id}`, json('DELETE')),
  addSoundbite: (mid: number, segment_id: number, title?: string) => req<Soundbite>(`/meetings/${mid}/soundbites`, json('POST', { segment_id, title })),
  deleteSoundbite: (id: number) => req<void>(`/soundbites/${id}`, json('DELETE')),

  tags: () => req<Tag[]>('/tags'),
  addTag: (mid: number, name: string) => req<Tag[]>(`/meetings/${mid}/tags`, json('POST', { name })),
  participants: () => req<Participant[]>('/participants'),
  search: (q: string) => req<SearchResults>(`/search?q=${encodeURIComponent(q)}`),

  chatHistory: (mid?: number) => req<ChatMessage[]>(mid ? `/meetings/${mid}/chat` : '/chat'),
  ask: (question: string, mid?: number) => req<ChatMessage>(mid ? `/meetings/${mid}/chat` : '/chat', json('POST', { question })),
  clearChat: (mid?: number) => req<void>(mid ? `/meetings/${mid}/chat` : '/chat', json('DELETE')),
  exportUrl: (id: number, format: 'md' | 'txt' | 'pdf') => `${API_BASE}/meetings/${id}/export?format=${format}`,
};
