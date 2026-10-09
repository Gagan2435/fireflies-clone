'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, ChevronDown, ChevronUp, MessageSquare, Search, X } from 'lucide-react';
import { colorFor, cx, formatTime } from '@/lib/utils';
import type { Comment, Segment, Soundbite } from '@/lib/types';
import Highlight from '@/components/ui/Highlight';

interface Props {
  segments: Segment[]; time: number; playing: boolean; q: string; setQ: (q: string) => void;
  comments: Comment[]; soundbites: Soundbite[];
  onSeek: (t: number) => void; onComment: (segmentId: number, text: string) => Promise<void>; onSoundbite: (segmentId: number) => Promise<void>;
}

export default function TranscriptPanel({ segments, time, playing, q, setQ, comments, soundbites, onSeek, onComment, onSoundbite }: Props) {
  const [cur, setCur] = useState(0);                       // index into matches
  const [commenting, setCommenting] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const rows = useRef<(HTMLDivElement | null)[]>([]);

  const active = useMemo(() => { let a = -1; segments.forEach((s, i) => { if (s.start_time <= time) a = i; }); return a; }, [segments, time]);
  const needle = q.trim().toLowerCase();
  const matches = useMemo(() => needle ? segments.flatMap((s, i) => (s.text.toLowerCase().includes(needle) ? [i] : [])) : [], [segments, needle]);
  useEffect(() => setCur(0), [needle]);

  const scrollTo = (i: number) => rows.current[i]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  useEffect(() => { if (matches.length) scrollTo(matches[Math.min(cur, matches.length - 1)]); }, [matches, cur]);
  useEffect(() => { if (playing && active >= 0 && !needle) scrollTo(active); }, [active, playing, needle]);

  const step = (d: number) => matches.length && setCur(c => (c + d + matches.length) % matches.length);
  const submit = async (segId: number) => { if (!draft.trim()) return; await onComment(segId, draft.trim()); setDraft(''); setCommenting(null); };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-mute" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search transcript" aria-label="Search transcript" className="input pl-8 pr-8"
            onKeyDown={e => { if (e.key === 'Enter') step(e.shiftKey ? -1 : 1); }} />
          {q && <button onClick={() => setQ('')} aria-label="Clear search" className="absolute right-2 top-2.5 text-mute hover:text-ink"><X className="h-3.5 w-3.5" /></button>}</div>
        {needle && <>
          <span className="w-16 text-center text-[12px] tabular-nums text-mute">{matches.length ? `${Math.min(cur, matches.length - 1) + 1} / ${matches.length}` : 'No matches'}</span>
          <button onClick={() => step(-1)} disabled={!matches.length} aria-label="Previous match" className="rounded p-1 hover:bg-hover disabled:opacity-40"><ChevronUp className="h-4 w-4" /></button>
          <button onClick={() => step(1)} disabled={!matches.length} aria-label="Next match" className="rounded p-1 hover:bg-hover disabled:opacity-40"><ChevronDown className="h-4 w-4" /></button></>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {segments.length === 0 && <p className="p-8 text-center text-mute">This meeting has no transcript.</p>}
        {segments.map((s, i) => {
          const name = s.speaker_name ?? 'Speaker';
          const isMatch = matches[Math.min(cur, matches.length - 1)] === i;
          const segComments = comments.filter(c => c.segment_id === s.id);
          const marked = soundbites.some(b => b.segment_id === s.id);
          return (
            <div key={s.id} ref={el => { rows.current[i] = el; }} onClick={() => onSeek(s.start_time)}
              className={cx('group relative cursor-pointer rounded-md border-l-2 px-3 py-2 transition-colors', i === active ? 'border-accent bg-accent/10' : 'border-transparent hover:bg-hover/50', isMatch && 'ring-1 ring-accent')}>
              <div className="flex items-center gap-2 text-[12px]">
                <span className="font-semibold" style={{ color: colorFor(name) }}>{name}</span>
                <button onClick={e => { e.stopPropagation(); onSeek(s.start_time); }} className="tabular-nums text-mute hover:text-accent" aria-label={`Jump to ${formatTime(s.start_time)}`}>{formatTime(s.start_time)}</button>
                {marked && <Bookmark className="h-3 w-3 fill-amber-400 text-amber-400" aria-label="Soundbite" />}
                <span className="ml-auto flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button onClick={e => { e.stopPropagation(); setCommenting(commenting === s.id ? null : s.id); }} aria-label="Add comment" title="Comment" className="rounded p-1 text-mute hover:bg-hover hover:text-ink"><MessageSquare className="h-3.5 w-3.5" /></button>
                  <button onClick={e => { e.stopPropagation(); onSoundbite(s.id); }} aria-label="Save as soundbite" title="Save as soundbite" className="rounded p-1 text-mute hover:bg-hover hover:text-ink"><Bookmark className="h-3.5 w-3.5" /></button>
                </span>
              </div>
              <p className="mt-0.5 text-[13px] leading-relaxed"><Highlight text={s.text} q={q} /></p>
              {segComments.map(c => <p key={c.id} className="mt-1.5 rounded bg-hover/70 px-2 py-1 text-[12px]"><span className="font-medium">{c.author_name}:</span> {c.text}</p>)}
              {commenting === s.id && (
                <form onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); submit(s.id); }} className="mt-2 flex gap-2">
                  <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} placeholder="Write a comment…" className="input py-1.5" />
                  <button className="btn-primary" disabled={!draft.trim()}>Post</button></form>)}
            </div>);
        })}
      </div>
    </div>
  );
}
