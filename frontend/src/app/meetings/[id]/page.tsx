'use client';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Download, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useApp } from '@/lib/app-context';
import { usePlayer } from '@/lib/usePlayer';
import { useClickOutside } from '@/lib/hooks';
import { cx, formatDuration, formatListDate } from '@/lib/utils';
import type { MeetingDetail } from '@/lib/types';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import Player from '@/components/meeting/Player';
import TranscriptPanel from '@/components/meeting/TranscriptPanel';
import SummaryTab from '@/components/meeting/SummaryTab';
import ActionItemsTab from '@/components/meeting/ActionItemsTab';
import OutlineTab from '@/components/meeting/OutlineTab';
import CommentsTab from '@/components/meeting/CommentsTab';
import EditMeetingModal from '@/components/meeting/EditMeetingModal';
import AskFredPanel from '@/components/askfred/AskFredPanel';

const TABS = ['Summary', 'Action items', 'Outline', 'Comments', 'Ask Fred'] as const;
type Tab = typeof TABS[number];

function ExportMenu({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);
  return (
    <div ref={ref} className="relative">
      <button className="btn-outline" onClick={() => setOpen(o => !o)} aria-expanded={open}><Download className="h-3.5 w-3.5" />Export</button>
      {open && <div className="menu absolute right-0 top-full z-30 mt-1 w-44 p-1">
        {([['pdf', 'PDF document'], ['md', 'Markdown'], ['txt', 'Plain text']] as const).map(([f, l]) => (
          <a key={f} href={api.exportUrl(id, f)} download onClick={() => { setOpen(false); toast.success(`Exporting ${l}…`); }} className="menu-item">{l}</a>))}
      </div>}
    </div>
  );
}

function Detail({ id }: { id: number }) {
  const router = useRouter();
  const sp = useSearchParams();
  const { refresh } = useApp();
  const [m, setM] = useState<MeetingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('Summary');
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const player = usePlayer(m?.duration ?? 0, m?.media_url ?? null);
  const { seek, toggle, time } = player;
  const applied = useRef(false);

  const load = useCallback(() => api.meeting(id).then(setM).catch(e => setError(e instanceof Error ? e.message : 'Failed to load')), [id]);
  useEffect(() => { load(); }, [load]);
  const changed = useCallback(() => { load(); refresh(); }, [load, refresh]);

  useEffect(() => {                                   // deep link from global search: ?t=seconds&q=term
    if (!m || applied.current) return;
    applied.current = true;
    const t = Number(sp.get('t')); if (sp.get('t') && !Number.isNaN(t)) seek(t);
    if (sp.get('q')) setQ(sp.get('q')!);
  }, [m, sp, seek]);

  useEffect(() => {                                   // Space = play/pause, arrows = seek
    const fn = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(el.tagName) || el.isContentEditable) return;
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      if (e.key === 'ArrowLeft') seek(time - 5);
      if (e.key === 'ArrowRight') seek(time + 5);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [toggle, seek, time]);

  if (error) return <div className="m-auto text-center"><p className="font-medium">Couldn&apos;t open this meeting</p><p className="mt-1 text-mute">{error}</p><Link href="/meetings" className="btn-primary mt-4">Back to Meetings</Link></div>;
  if (!m) return <div className="space-y-3 p-6"><div className="h-6 w-1/3 animate-pulse rounded bg-hover/60" /><div className="h-64 animate-pulse rounded bg-hover/40" /></div>;

  const seekSegment = (sid: number | null) => { const s = m.segments.find(x => x.id === sid); if (s) { seek(s.start_time); setQ(''); } };
  const seekPlay = (t: number) => { seek(t); player.play(); };

  const remove = async () => {
    try { await api.deleteMeeting(m.id); toast.success('Meeting deleted'); refresh(); router.push('/meetings'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not delete'); }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-3 py-3 sm:px-5">
        <Link href="/meetings" aria-label="Back to meetings" className="rounded p-1 text-mute hover:bg-hover hover:text-ink"><ChevronLeft className="h-4 w-4" /></Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[16px] font-semibold">{m.title}</h1>
          <p className="text-[12px] text-mute">{formatListDate(m.date)} · {formatDuration(m.duration)}</p>
        </div>
        <div className="flex -space-x-1.5" aria-label="Participants">{m.participants.map(p => <Avatar key={p.id} name={p.name} size={26} />)}</div>
        <ExportMenu id={m.id} />
        <button className="btn-outline" onClick={() => setEdit(true)}><Pencil className="h-3.5 w-3.5" />Edit</button>
        <button className="btn-outline text-red-400 hover:text-red-400" onClick={() => setConfirmDelete(true)} aria-label="Delete meeting"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* notes */}
        <section className="flex min-h-[420px] min-w-0 flex-col border-b border-line lg:min-h-0 lg:w-[44%] lg:max-w-[560px] lg:border-b-0 lg:border-r" aria-label="Meeting notes">
          <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line px-3 no-scrollbar">
            {TABS.map(t => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                className={cx('whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px]', tab === t ? 'border-accent font-medium text-ink' : 'border-transparent text-mute hover:text-ink')}>
                {t}{t === 'Action items' && m.open_action_items > 0 && <span className="ml-1.5 rounded-full bg-accent/20 px-1.5 text-[10px] text-accent">{m.open_action_items}</span>}</button>))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {tab === 'Summary' && <SummaryTab m={m} onSeek={seekPlay} onChange={changed} />}
            {tab === 'Action items' && <ActionItemsTab m={m} onChange={changed} onSeekSegment={seekSegment} />}
            {tab === 'Outline' && <OutlineTab m={m} onSeek={seekPlay} />}
            {tab === 'Comments' && <CommentsTab m={m} onSeek={seekPlay} onChange={changed} />}
            {tab === 'Ask Fred' && <AskFredPanel meetingId={m.id} scope={m.title} heading="Ask anything about this meeting"
              suggestions={['Summarize this meeting', 'What are the action items?', 'What decisions were made?']} className="h-[560px] lg:h-full" />}
          </div>
        </section>

        {/* player + transcript */}
        <section className="flex min-h-[520px] min-w-0 flex-1 flex-col lg:min-h-0" aria-label="Transcript">
          <Player player={player} duration={m.duration} title={m.title} chapters={m.chapters} soundbites={m.soundbites} />
          <TranscriptPanel segments={m.segments} time={player.time} playing={player.playing} q={q} setQ={setQ} comments={m.comments} soundbites={m.soundbites}
            onSeek={seekPlay}
            onComment={async (sid, text) => { try { await api.addComment(m.id, text, sid); toast.success('Comment added'); changed(); } catch { toast.error('Could not post comment'); } }}
            onSoundbite={async sid => { try { await api.addSoundbite(m.id, sid); toast.success('Saved as soundbite'); changed(); } catch { toast.error('Could not save soundbite'); } }} />
        </section>
      </div>

      {edit && <EditMeetingModal meeting={m} onClose={() => setEdit(false)} onSaved={changed} />}
      {confirmDelete && (
        <Modal title="Delete this meeting?" onClose={() => setConfirmDelete(false)}>
          <div className="space-y-4 p-5"><p className="text-mute">“{m.title}” and its transcript, summary, action items and comments will be permanently deleted.</p>
            <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="btn bg-red-500 text-white hover:bg-red-600" onClick={remove}>Delete meeting</button></div></div>
        </Modal>)}
    </div>
  );
}

export default function Page({ params }: { params: { id: string } }) {
  return <Suspense><Detail id={Number(params.id)} /></Suspense>;
}
