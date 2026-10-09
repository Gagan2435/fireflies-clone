'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useApp } from '@/lib/app-context';
import { cx, formatShortDate } from '@/lib/utils';
import type { MeetingListItem, Task } from '@/lib/types';
import Modal from '@/components/ui/Modal';

function NewTask({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [ms, setMs] = useState<MeetingListItem[]>([]);
  const [mid, setMid] = useState<number | ''>('');
  const [text, setText] = useState('');
  const [who, setWho] = useState('');
  const [due, setDue] = useState('');
  useEffect(() => { api.meetings().then(r => { setMs(r); if (r[0]) setMid(r[0].id); }).catch(() => undefined); }, []);
  const save = async () => {
    if (!text.trim() || mid === '') return;
    try { await api.addActionItem(mid, { text: text.trim(), assignee_name: who.trim() || null, due_date: due || null }); toast.success('Task added'); onDone(); onClose(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not add task'); }
  };
  return (
    <Modal title="New task" onClose={onClose}><div className="space-y-3 p-5">
      <input className="input" autoFocus placeholder="What needs to be done?" value={text} onChange={e => setText(e.target.value)} aria-label="Task" />
      <select className="input" value={mid} onChange={e => setMid(Number(e.target.value))} aria-label="Meeting">{ms.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select>
      <div className="flex gap-2"><input className="input" placeholder="Assignee" value={who} onChange={e => setWho(e.target.value)} aria-label="Assignee" /><input type="date" className="input w-44" value={due} onChange={e => setDue(e.target.value)} aria-label="Due date" /></div>
      <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={!text.trim() || mid === ''} onClick={save}>Add task</button></div>
    </div></Modal>
  );
}

export default function Tasks() {
  const { me, version, refresh } = useApp();
  const [tab, setTab] = useState<'mine' | 'all'>('all');
  const [show, setShow] = useState<'open' | 'done' | 'all'>('open');
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [adding, setAdding] = useState(false);
  const load = useCallback(() => api.tasks().then(setTasks).catch(() => setTasks([])), []);
  useEffect(() => { load(); }, [load, version]);

  const toggle = async (t: Task) => { try { await api.patchActionItem(t.id, { completed: !t.completed }); load(); refresh(); } catch { toast.error('Update failed'); } };
  const today = new Date().toISOString().slice(0, 10);
  const list = (tasks ?? []).filter(t => (tab === 'all' || t.assignee_name === me?.name) && (show === 'all' || (show === 'done') === t.completed));

  return (
    <div className="mx-auto w-full max-w-[760px] px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md bg-hover/60 p-0.5 text-[12px]">{(['mine', 'all'] as const).map(k => <button key={k} onClick={() => setTab(k)} className={cx('rounded px-3 py-1', tab === k ? 'bg-card font-medium shadow-sm' : 'text-mute')}>{k === 'mine' ? 'My Tasks' : 'All Tasks'}</button>)}</div>
        <div className="flex rounded-md bg-hover/60 p-0.5 text-[12px]">{(['open', 'done', 'all'] as const).map(k => <button key={k} onClick={() => setShow(k)} className={cx('rounded px-3 py-1 capitalize', show === k ? 'bg-card font-medium shadow-sm' : 'text-mute')}>{k}</button>)}</div>
        <button className="btn-primary ml-auto" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" />New</button>
      </div>
      <div className="mt-4 space-y-2">
        {tasks === null && [0, 1, 2].map(i => <div key={i} className="h-14 animate-pulse rounded-lg bg-hover/50" />)}
        {tasks && list.length === 0 && <div className="py-16 text-center"><p className="font-medium">{tab === 'mine' ? 'No tasks assigned to you' : 'All your meeting tasks in one place'}</p><p className="mt-1 text-mute">Manage, assign and update all your meeting tasks here.</p></div>}
        {list.map(t => { const late = !t.completed && t.due_date && t.due_date < today; return (
          <div key={t.id} className="flex items-start gap-3 rounded-lg border border-line bg-card px-4 py-3">
            <button role="checkbox" aria-checked={t.completed} aria-label={`Mark "${t.text}" ${t.completed ? 'open' : 'done'}`} onClick={() => toggle(t)} className={cx('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border', t.completed ? 'border-good bg-good text-white' : 'border-mute')}>{t.completed && <Check className="h-3 w-3" />}</button>
            <div className="min-w-0 flex-1"><p className={cx(t.completed && 'text-mute line-through')}>{t.text}</p>
              <p className="mt-0.5 text-[12px] text-mute"><Link href={`/meetings/${t.meeting_id}`} className="hover:text-accent hover:underline">{t.meeting_title}</Link>{t.assignee_name && <> · {t.assignee_name}</>}</p></div>
            {t.due_date && <span className={cx('shrink-0 text-[12px]', late ? 'text-red-400' : 'text-mute')}>{late ? 'Overdue · ' : 'Due '}{formatShortDate(t.due_date)}</span>}
          </div>); })}
      </div>
      {adding && <NewTask onClose={() => setAdding(false)} onDone={() => { load(); refresh(); }} />}
    </div>
  );
}
