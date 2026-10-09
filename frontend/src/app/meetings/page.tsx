'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Hash, Headphones, LayoutGrid, Plus, Search, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { useApp } from '@/lib/app-context';
import { useDebounced } from '@/lib/hooks';
import { cx } from '@/lib/utils';
import type { MeetingFilters, MeetingListItem } from '@/lib/types';
import MeetingRow from '@/components/meetings/MeetingRow';
import FiltersPopover, { activeFilterCount } from '@/components/meetings/FiltersPopover';
import AskFredPanel from '@/components/askfred/AskFredPanel';

type Channel = 'mine' | 'all' | 'voice' | 'uploads';
const CHANNELS: { id: Channel; label: string; icon: typeof Hash; tag?: string }[] = [
  { id: 'mine', label: 'My Meetings', icon: Hash }, { id: 'all', label: 'All Meetings', icon: LayoutGrid },
  { id: 'voice', label: 'Voice Agent Meetings', icon: Headphones }, { id: 'uploads', label: 'Uploads', icon: Upload, tag: 'NEW' },
];
const SUGGESTIONS = ['My action items', 'Key initiatives', 'Summarize my last meeting'];

export default function Library() {
  const router = useRouter();
  const { version, comingSoon } = useApp();
  const [channel, setChannel] = useState<Channel>('mine');
  const [tab, setTab] = useState<'hosted' | 'shared'>('hosted');
  const [filters, setFilters] = useState<MeetingFilters>({});
  const [q, setQ] = useState('');
  const [chanQ, setChanQ] = useState('');
  const dq = useDebounced(q, 250);
  const [items, setItems] = useState<MeetingListItem[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    setError(false);
    api.meetings({ ...filters, q: dq }).then(r => live && setItems(r)).catch(() => live && (setError(true), setItems([])));
    return () => { live = false; };
  }, [filters, dq, version]);

  const visible = useMemo(() => {
    if (!items) return null;
    if (tab === 'shared' || channel === 'voice') return [];          // sharing + voice agents are placeholders
    return channel === 'uploads' ? items.filter(m => m.platform === 'upload' || m.source === 'upload') : items;
  }, [items, channel, tab]);
  const filtered = !!dq || activeFilterCount(filters) > 0;

  return (
    <div className="flex min-h-0 flex-1">
      {/* channels */}
      <aside className="hidden w-[230px] shrink-0 flex-col border-r border-line bg-panel p-3 md:flex">
        <div className="relative"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-mute" /><input value={chanQ} onChange={e => setChanQ(e.target.value)} className="input pl-8" placeholder="Search channels" aria-label="Search channels" /></div>
        <nav className="mt-3 space-y-0.5">
          {CHANNELS.filter(c => c.label.toLowerCase().includes(chanQ.toLowerCase())).map(c => (
            <button key={c.id} onClick={() => setChannel(c.id)} className={cx('flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px]', channel === c.id ? 'bg-accent/20 text-ink' : 'text-mute hover:bg-hover hover:text-ink')}>
              <c.icon className="h-3.5 w-3.5" /><span className="flex-1">{c.label}</span>{c.tag && <span className="rounded bg-good/20 px-1 text-[9px] font-bold text-good">{c.tag}</span>}</button>))}
        </nav>
        <div className="mt-5 border-t border-line pt-3 text-center">
          <p className="text-left text-[12px] font-medium">All channels</p>
          <p className="mt-3 text-[12px] text-mute">Create channels to organize your conversations</p>
          <button onClick={() => comingSoon('Channels')} className="btn-outline mt-2"><Plus className="h-3.5 w-3.5" />Channel</button>
        </div>
      </aside>

      {/* list */}
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
          <div className="flex rounded-md bg-hover/60 p-0.5">
            {(['hosted', 'shared'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={cx('rounded px-2.5 py-1 text-[12px]', tab === t ? 'bg-card font-medium shadow-sm' : 'text-mute')}>{t === 'hosted' ? 'Hosted by me' : 'Shared with me'}</button>))}
          </div>
          <FiltersPopover value={filters} onChange={setFilters} />
          <div className="relative w-full sm:ml-auto sm:max-w-[240px]"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-mute" />
            <input value={q} onChange={e => setQ(e.target.value)} className="input pl-8" placeholder="Search meetings" aria-label="Search meetings" /></div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {visible === null && <div className="space-y-2">{[0, 1, 2, 3].map(i => <div key={i} className="h-[74px] animate-pulse rounded-lg bg-hover/50" />)}</div>}
          {visible?.length === 0 && (
            <div className="mx-auto mt-16 max-w-sm text-center">
              {error ? <p className="text-mute">Couldn&apos;t load meetings. Is the backend running on port 8000?</p> : filtered ? (<>
                <p className="font-medium">No meetings match</p><p className="mt-1 text-mute">Try a different search or clear your filters.</p>
                <button className="btn-ghost mt-3" onClick={() => { setQ(''); setFilters({}); }}>Clear search &amp; filters</button></>) : tab === 'shared' ? (<>
                <p className="font-medium">Nothing shared with you yet</p><p className="mt-1 text-mute">Team sharing is coming soon.</p></>) : channel === 'voice' ? (<>
                <p className="font-medium">Let a voice agent take your meetings</p><p className="mt-1 text-mute">Voice agents are coming soon.</p></>) : (<>
                <p className="font-medium">Looks like you haven&apos;t recorded a meeting yet</p>
                <p className="mt-1 text-mute">Once you record your first meeting with Fireflies, it&apos;ll show up right here.</p>
                <button className="btn-primary mt-4" onClick={() => router.push('/uploads')}><Plus className="h-3.5 w-3.5" />Add transcript</button></>)}
            </div>)}
          {visible && visible.length > 0 && <>
            <p className="mb-2 flex items-center gap-1.5 text-[12px] text-mute"><FileText className="h-3.5 w-3.5" />{visible.length} meeting{visible.length === 1 ? '' : 's'}</p>
            <div className="space-y-2">{visible.map(m => <MeetingRow key={m.id} m={m} />)}</div></>}
        </div>
      </section>

      <AskFredPanel scope={CHANNELS.find(c => c.id === channel)!.label} suggestions={SUGGESTIONS} className="hidden w-[320px] shrink-0 border-l border-line xl:flex" />
    </div>
  );
}
