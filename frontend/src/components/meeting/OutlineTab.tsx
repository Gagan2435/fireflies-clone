import { formatTime } from '@/lib/utils';
import type { MeetingDetail } from '@/lib/types';

export default function OutlineTab({ m, onSeek }: { m: MeetingDetail; onSeek: (t: number) => void }) {
  if (m.chapters.length === 0) return <p className="p-8 text-center text-mute">No chapters were generated for this meeting.</p>;
  return (
    <ol className="space-y-1 p-4">{m.chapters.map((c, i) => (
      <li key={c.id}>
        <button onClick={() => onSeek(c.start_time)} className="flex w-full gap-3 rounded-md p-2.5 text-left hover:bg-hover">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-[11px] font-semibold text-accent">{i + 1}</span>
          <span className="min-w-0 flex-1"><span className="flex items-baseline justify-between gap-2"><span className="font-medium">{c.title}</span><span className="text-[11px] tabular-nums text-accent">{formatTime(c.start_time)}</span></span>
            {c.summary && <span className="mt-0.5 block leading-relaxed text-mute">{c.summary}</span>}</span>
        </button></li>))}
    </ol>
  );
}
