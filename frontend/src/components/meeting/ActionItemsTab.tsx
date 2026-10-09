'use client';
import { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { cx, formatShortDate } from '@/lib/utils';
import type { ActionItem, MeetingDetail } from '@/lib/types';

function Item({ it, onChange, onSeekSegment }: { it: ActionItem; onChange: () => void; onSeekSegment: (id: number | null) => void }) {
  const [text, setText] = useState(it.text);
  const patch = async (p: Parameters<typeof api.patchActionItem>[1]) => {
    try { await api.patchActionItem(it.id, p); onChange(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Update failed'); }
  };
  const overdue = !it.completed && it.due_date && it.due_date < new Date().toISOString().slice(0, 10);
  return (
    <li className="group flex items-start gap-2.5 rounded-md border border-line bg-card p-2.5">
      <button onClick={() => patch({ completed: !it.completed })} role="checkbox" aria-checked={it.completed} aria-label={`Mark "${it.text}" ${it.completed ? 'open' : 'done'}`}
        className={cx('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border', it.completed ? 'border-good bg-good text-white' : 'border-mute')}>{it.completed && <Check className="h-3 w-3" />}</button>
      <div className="min-w-0 flex-1">
        <input value={text} onChange={e => setText(e.target.value)} aria-label="Action item text" onBlur={() => text.trim() && text !== it.text && patch({ text: text.trim() })}
          onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className={cx('w-full bg-transparent outline-none focus:border-b focus:border-accent', it.completed && 'text-mute line-through')} />
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-mute">
          <input defaultValue={it.assignee_name ?? ''} placeholder="Unassigned" aria-label="Assignee" onBlur={e => e.target.value !== (it.assignee_name ?? '') && patch({ assignee_name: e.target.value.trim() || null })}
            className="w-28 rounded bg-hover/60 px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-accent" />
          <input type="date" defaultValue={it.due_date ?? ''} aria-label="Due date" onChange={e => patch({ due_date: e.target.value || null })} className={cx('rounded bg-hover/60 px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-accent', overdue && 'text-red-400')} />
          {overdue && <span className="text-red-400">Overdue · {formatShortDate(it.due_date!)}</span>}
          {it.segment_id && <button onClick={() => onSeekSegment(it.segment_id)} className="text-accent hover:underline">View in transcript</button>}
        </div>
      </div>
      <button onClick={async () => { await api.deleteActionItem(it.id); toast.success('Action item deleted'); onChange(); }} aria-label="Delete action item" className="rounded p-1 text-mute opacity-0 hover:bg-hover hover:text-red-400 group-hover:opacity-100 focus:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
    </li>
  );
}

export default function ActionItemsTab({ m, onChange, onSeekSegment }: { m: MeetingDetail; onChange: () => void; onSeekSegment: (id: number | null) => void }) {
  const [text, setText] = useState('');
  const [assignee, setAssignee] = useState('');
  const [due, setDue] = useState('');
  const open = m.action_items.filter(a => !a.completed).length;

  const add = async () => {
    if (!text.trim()) return;
    try { await api.addActionItem(m.id, { text: text.trim(), assignee_name: assignee.trim() || null, due_date: due || null }); setText(''); setAssignee(''); setDue(''); toast.success('Action item added'); onChange(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not add'); }
  };
  return (
    <div className="space-y-4 p-4">
      <p className="text-[12px] text-mute">{open} open · {m.action_items.length - open} done</p>
      <ul className="space-y-2">{m.action_items.map(it => <Item key={`${it.id}-${it.text}-${it.completed}`} it={it} onChange={onChange} onSeekSegment={onSeekSegment} />)}
        {m.action_items.length === 0 && <li className="rounded-md border border-dashed border-line p-6 text-center text-mute">No action items were found. Add one below.</li>}</ul>
      <form onSubmit={e => { e.preventDefault(); add(); }} className="space-y-2 rounded-md border border-line p-3">
        <input className="input" placeholder="New action item…" value={text} onChange={e => setText(e.target.value)} aria-label="New action item" />
        <div className="flex gap-2">
          <input className="input" list="people" placeholder="Assignee" value={assignee} onChange={e => setAssignee(e.target.value)} aria-label="Assignee" />
          <datalist id="people">{m.participants.map(p => <option key={p.id} value={p.name} />)}</datalist>
          <input className="input w-40" type="date" value={due} onChange={e => setDue(e.target.value)} aria-label="Due date" />
          <button className="btn-primary shrink-0" disabled={!text.trim()}><Plus className="h-3.5 w-3.5" />Add</button></div>
      </form>
    </div>
  );
}
