'use client';
import { useState } from 'react';
import { Pencil, Plus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { formatTime } from '@/lib/utils';
import type { MeetingDetail } from '@/lib/types';

export default function SummaryTab({ m, onSeek, onChange }: { m: MeetingDetail; onSeek: (t: number) => void; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(m.overview ?? '');
  const [busy, setBusy] = useState(false);
  const [tag, setTag] = useState('');

  const saveOverview = async () => {
    try { await api.updateMeeting(m.id, { overview: text }); setEditing(false); toast.success('Summary saved'); onChange(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save'); }
  };
  const regenerate = async () => {
    setBusy(true);
    try { await api.regenerateNotes(m.id); toast.success('Notes regenerated from the transcript'); onChange(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not regenerate'); }
    finally { setBusy(false); }
  };
  const addTag = async () => {
    const name = tag.trim().replace(/^#/, '');
    if (!name) return;
    try { await api.addTag(m.id, name); setTag(''); onChange(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not add tag'); }
  };

  return (
    <div className="space-y-6 p-4">
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold">Overview</h3>
          <div className="flex gap-1">
            <button onClick={() => { setText(m.overview ?? ''); setEditing(e => !e); }} className="btn-ghost px-2 py-1" aria-label="Edit summary"><Pencil className="h-3 w-3" />Edit</button>
            <button onClick={regenerate} disabled={busy} className="btn-ghost px-2 py-1"><RefreshCw className={busy ? 'h-3 w-3 animate-spin' : 'h-3 w-3'} />Regenerate</button>
          </div>
        </div>
        {editing ? (<>
          <textarea className="input h-36" value={text} onChange={e => setText(e.target.value)} />
          <div className="mt-2 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button><button className="btn-primary" onClick={saveOverview}>Save</button></div></>
        ) : <p className="leading-relaxed text-ink/90">{m.overview || <span className="text-mute">No summary yet. Click Regenerate to create one from the transcript.</span>}</p>}
      </section>

      <section>
        <h3 className="mb-2 text-[13px] font-semibold">Keywords</h3>
        <div className="flex flex-wrap gap-1.5">{m.keywords.map(k => <span key={k} className="rounded-full border border-line px-2.5 py-0.5 text-[12px]">{k}</span>)}
          {m.keywords.length === 0 && <span className="text-mute">None</span>}</div>
      </section>

      <section>
        <h3 className="mb-2 text-[13px] font-semibold">Key points</h3>
        <ul className="space-y-2">{m.key_points.map(k => (
          <li key={k.id} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span className="flex-1 leading-relaxed">{k.text}{k.start_time != null && <button onClick={() => onSeek(k.start_time!)} className="ml-2 text-[11px] tabular-nums text-accent hover:underline">{formatTime(k.start_time)}</button>}</span>
          </li>))}
          {m.key_points.length === 0 && <li className="text-mute">None</li>}</ul>
      </section>

      <section>
        <h3 className="mb-2 text-[13px] font-semibold">Tags</h3>
        <div className="flex flex-wrap items-center gap-1.5">{m.tags.map(t => <span key={t.id} className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[12px] text-accent">#{t.name}</span>)}
          <form onSubmit={e => { e.preventDefault(); addTag(); }} className="flex items-center gap-1">
            <input value={tag} onChange={e => setTag(e.target.value)} placeholder="Add tag" aria-label="Add tag" className="w-24 rounded-full border border-line bg-transparent px-2.5 py-0.5 text-[12px] outline-none focus:border-accent" />
            <button aria-label="Add tag" className="rounded-full p-1 text-mute hover:bg-hover"><Plus className="h-3 w-3" /></button></form></div>
      </section>
    </div>
  );
}
