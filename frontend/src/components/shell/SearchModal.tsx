'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, FileText, MessageSquareText, Search, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useApp } from '@/lib/app-context';
import { useDebounced } from '@/lib/hooks';
import { formatDate, formatTime } from '@/lib/utils';
import Highlight from '@/components/ui/Highlight';
import type { SearchResults } from '@/lib/types';


export default function SearchModal() {
  const { closeModal } = useApp();
  const router = useRouter();
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 200);
  const [res, setRes] = useState<SearchResults | null>(null);
  const [err, setErr] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    if (!dq.trim()) { setRes(null); return; }
    let live = true;
    api.search(dq).then(r => { if (live) { setRes(r); setErr(false); } }).catch(() => live && setErr(true));
    return () => { live = false; };
  }, [dq]);

  const open = (href: string) => { closeModal(); router.push(href); };
  const rows: { key: string; href: string; icon: 'doc' | 'line'; title: string; sub: string; snippet?: string }[] = [];
  res?.meetings.slice(0, 5).forEach(m => rows.push({ key: `m${m.id}`, href: `/meetings/${m.id}`, icon: 'doc', title: m.title, sub: formatDate(m.date) }));
  res?.hits.filter(h => h.kind === 'transcript').slice(0, 6).forEach(h => rows.push({
    key: `h${h.segment_id}`, href: `/meetings/${h.meeting_id}?t=${Math.floor(h.start_time ?? 0)}&q=${encodeURIComponent(dq.trim())}`,
    icon: 'line', title: h.meeting_title, sub: formatTime(h.start_time ?? 0), snippet: h.snippet }));

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center bg-black/60 p-4 pt-[12vh]" onMouseDown={e => e.target === e.currentTarget && closeModal()}>
      <div className="card w-full max-w-[560px] overflow-hidden shadow-pop" role="dialog" aria-label="Search">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <Search className="h-4 w-4 text-mute" />
          <input ref={input} value={q} onChange={e => setQ(e.target.value)} placeholder="Search by title or keyword..." className="flex-1 bg-transparent outline-none placeholder:text-mute"
            onKeyDown={e => { if (e.key === 'Escape') closeModal(); if (e.key === 'Enter' && rows[0]) open(rows[0].href); }} />
          <button onClick={closeModal} aria-label="Close" className="text-mute hover:text-ink"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-1.5">
          <button onClick={() => open(`/askfred${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`)} className="flex w-full items-center gap-2 rounded-md bg-accent/15 px-3 py-2.5 text-left hover:bg-accent/25">
            <Bot className="h-4 w-4 text-accent" /><span className="flex-1 font-medium">Ask Fred anything about your meetings</span><span className="text-[12px] text-accent">Try AskFred</span>
          </button>
          {err && <p className="px-3 py-4 text-center text-mute">Couldn&apos;t reach the server. Is the backend running?</p>}
          {res && rows.length === 0 && !err && <p className="px-3 py-6 text-center text-mute">No results for “{dq}”</p>}
          {rows.map(r => (
            <button key={r.key} onClick={() => open(r.href)} className="menu-item items-start py-2">
              {r.icon === 'doc' ? <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mute" /> : <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mute" />}
              <span className="min-w-0 flex-1"><span className="block truncate font-medium"><Highlight text={r.title} q={r.icon === 'doc' ? dq : ''} /></span>
                {r.snippet && <span className="block truncate text-[12px] text-mute"><Highlight text={r.snippet} q={dq} /></span>}</span>
              <span className="shrink-0 text-[11px] text-mute">{r.sub}</span>
            </button>))}
        </div>
      </div>
    </div>
  );
}
