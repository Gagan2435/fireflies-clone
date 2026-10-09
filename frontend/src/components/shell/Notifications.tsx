'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCircle2, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { useApp } from '@/lib/app-context';
import { useClickOutside } from '@/lib/hooks';
import { timeAgo } from '@/lib/utils';

interface Note { key: string; href: string; icon: 'doc' | 'task'; text: string; when: string }

/** Real notifications derived from data: freshly processed meetings and overdue tasks. */
export default function Notifications() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const { version } = useApp();
  useClickOutside(ref, () => setOpen(false), open);

  useEffect(() => {
    Promise.all([api.meetings({ sort_by: 'recency' }), api.tasks()]).then(([ms, ts]) => {
      const out: Note[] = ms.slice(0, 3).map(m => ({ key: `m${m.id}`, href: `/meetings/${m.id}`, icon: 'doc' as const, text: `Notes are ready for “${m.title}”`, when: m.date }));
      const today = new Date().toISOString().slice(0, 10);
      ts.filter(t => !t.completed && t.due_date && t.due_date < today).slice(0, 3)
        .forEach(t => out.push({ key: `t${t.id}`, href: `/meetings/${t.meeting_id}`, icon: 'task', text: `Overdue: ${t.text}`, when: t.created_at }));
      setNotes(out);
    }).catch(() => setNotes([]));
  }, [version]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} aria-label="Notifications" className="relative rounded-md p-1.5 text-mute hover:bg-hover hover:text-ink">
        <Bell className="h-4 w-4" />{notes.length > 0 && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent" />}
      </button>
      {open && (
        <div className="menu absolute right-0 top-full z-50 mt-1 w-80 max-w-[calc(100vw-1.5rem)] p-1.5">
          <p className="px-2.5 py-1.5 text-[12px] font-semibold">Notifications</p>
          {notes.length === 0 && <p className="px-2.5 py-6 text-center text-mute">You&apos;re all caught up</p>}
          {notes.map(n => (
            <Link key={n.key} href={n.href} onClick={() => setOpen(false)} className="menu-item items-start">
              {n.icon === 'doc' ? <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" /> : <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />}
              <span className="min-w-0 flex-1"><span className="block truncate">{n.text}</span><span className="text-[11px] text-mute">{timeAgo(n.when)}</span></span>
            </Link>))}
        </div>)}
    </div>
  );
}
