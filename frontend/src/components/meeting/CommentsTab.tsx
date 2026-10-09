'use client';
import { useState } from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { formatTime, timeAgo } from '@/lib/utils';
import type { MeetingDetail } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';

export default function CommentsTab({ m, onSeek, onChange }: { m: MeetingDetail; onSeek: (t: number) => void; onChange: () => void }) {
  const [text, setText] = useState('');
  const post = async () => {
    if (!text.trim()) return;
    try { await api.addComment(m.id, text.trim()); setText(''); onChange(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not post'); }
  };
  const segTime = (id: number | null) => m.segments.find(s => s.id === id)?.start_time;
  return (
    <div className="space-y-6 p-4">
      <section>
        <h3 className="mb-2 text-[13px] font-semibold">Comments ({m.comments.length})</h3>
        <ul className="space-y-3">{m.comments.map(c => { const t = segTime(c.segment_id); return (
          <li key={c.id} className="group flex gap-2.5"><Avatar name={c.author_name} size={24} />
            <div className="min-w-0 flex-1"><p className="text-[12px]"><span className="font-medium">{c.author_name}</span> <span className="text-mute">{timeAgo(c.created_at)}</span>
              {t !== undefined && <button onClick={() => onSeek(t)} className="ml-2 tabular-nums text-accent hover:underline">{formatTime(t)}</button>}</p>
              <p className="mt-0.5 leading-relaxed">{c.text}</p></div>
            <button onClick={async () => { await api.deleteComment(c.id); onChange(); }} aria-label="Delete comment" className="self-start rounded p-1 text-mute opacity-0 hover:text-red-400 group-hover:opacity-100 focus:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button></li>); })}
          {m.comments.length === 0 && <li className="text-mute">No comments yet. Hover a transcript line to comment on it.</li>}</ul>
        <form onSubmit={e => { e.preventDefault(); post(); }} className="mt-3 flex gap-2"><input className="input" placeholder="Add a comment to this meeting…" value={text} onChange={e => setText(e.target.value)} aria-label="New comment" /><button className="btn-primary" disabled={!text.trim()}>Post</button></form>
      </section>
      <section>
        <h3 className="mb-2 text-[13px] font-semibold">Soundbites ({m.soundbites.length})</h3>
        <ul className="space-y-1.5">{m.soundbites.map(s => (
          <li key={s.id} className="group flex items-center gap-2 rounded-md border border-line bg-card p-2">
            <Bookmark className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
            <button onClick={() => onSeek(s.start_time)} className="min-w-0 flex-1 truncate text-left hover:text-accent">{s.title}</button>
            <span className="text-[11px] tabular-nums text-mute">{formatTime(s.start_time)}–{formatTime(s.end_time)}</span>
            <button onClick={async () => { await api.deleteSoundbite(s.id); onChange(); }} aria-label="Delete soundbite" className="rounded p-1 text-mute opacity-0 hover:text-red-400 group-hover:opacity-100 focus:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button></li>))}
          {m.soundbites.length === 0 && <li className="text-mute">Save a transcript line as a soundbite using the bookmark icon.</li>}</ul>
      </section>
    </div>
  );
}
