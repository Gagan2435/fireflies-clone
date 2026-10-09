import Link from 'next/link';
import { CheckCircle2, Video } from 'lucide-react';
import type { MeetingListItem } from '@/lib/types';
import { formatDuration, formatListDate } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';

const PLATFORM: Record<string, { label: string; color: string }> = {
  zoom: { label: 'Zoom', color: '#2d8cff' }, meet: { label: 'Google Meet', color: '#00ac47' },
  teams: { label: 'Teams', color: '#6264a7' }, upload: { label: 'Upload', color: '#9a9aa8' },
};

export default function MeetingRow({ m }: { m: MeetingListItem }) {
  const p = m.platform ? PLATFORM[m.platform] : null;
  return (
    <Link href={`/meetings/${m.id}`} className="group flex items-start gap-3 rounded-lg border border-line bg-card px-4 py-3 transition-colors hover:border-accent/50 hover:bg-hover/60">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-hover" style={{ color: p?.color }}><Video className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium group-hover:text-accent">{m.title}</p>
        <p className="mt-0.5 text-[12px] text-mute">{formatListDate(m.date)} · {formatDuration(m.duration)}{p && <> · {p.label}</>}</p>
        {m.tags.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1">{m.tags.map(t => <span key={t.id} className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] text-accent">#{t.name}</span>)}</div>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <div className="flex -space-x-1.5">{m.participants.slice(0, 4).map(pt => <Avatar key={pt.id} name={pt.name} size={22} />)}
          {m.participants.length > 4 && <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-hover text-[10px] ring-2 ring-card">+{m.participants.length - 4}</span>}</div>
        {m.total_action_items > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-mute"><CheckCircle2 className="h-3 w-3" />{m.total_action_items - m.open_action_items}/{m.total_action_items} tasks</span>}
      </div>
    </Link>
  );
}
