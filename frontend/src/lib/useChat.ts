'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from './api';
import type { ChatMessage } from './types';

/** Persisted Ask Fred conversation. `meetingId` undefined = the workspace-wide chat. */
export function useChat(meetingId?: number, initialQuestion?: string) {
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const sentInitial = useRef(false);

  useEffect(() => { api.chatHistory(meetingId).then(setMsgs).catch(() => setMsgs([])); }, [meetingId]);

  const send = useCallback(async (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    setBusy(true);
    setMsgs(m => [...m, { id: -Date.now(), meeting_id: meetingId ?? null, role: 'user', content: question, sources: [], created_at: new Date().toISOString() }]);
    try { const a = await api.ask(question, meetingId); setMsgs(m => [...m, a]); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Fred could not answer'); }
    finally { setBusy(false); }
  }, [busy, meetingId]);

  useEffect(() => { if (initialQuestion && !sentInitial.current) { sentInitial.current = true; send(initialQuestion); } }, [initialQuestion, send]);

  const clear = useCallback(async () => { await api.clearChat(meetingId).catch(() => undefined); setMsgs([]); toast.success('Chat cleared'); }, [meetingId]);
  return { msgs, busy, send, clear };
}
