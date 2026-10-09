'use client';
import { useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { useClickOutside } from '@/lib/hooks';
import { INTEGRATIONS, MORE_FILTERS, PRIMARY_FILTERS } from '@/lib/integrations';
import { cx } from '@/lib/utils';

export default function IntegrationsPage() {
  const { comingSoon } = useApp();
  const [tab, setTab] = useState<'discover' | 'connected'>('discover');
  const [filter, setFilter] = useState<string>('All');
  const [q, setQ] = useState('');
  const [more, setMore] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setMore(false), more);
  const list = useMemo(() => INTEGRATIONS.filter(i => (filter === 'All' || i.category === filter) && (i.name + i.desc).toLowerCase().includes(q.trim().toLowerCase())), [filter, q]);
  const isMore = (MORE_FILTERS as readonly string[]).includes(filter);

  return (
    <div className="mx-auto w-full max-w-[920px] px-4 pb-10 sm:px-6">
      <div className="flex justify-center border-b border-line">
        {(['discover', 'connected'] as const).map(k => <button key={k} onClick={() => setTab(k)} className={cx('border-b-2 px-4 py-3 text-[13px] capitalize', tab === k ? 'border-accent text-ink' : 'border-transparent text-mute')}>{k}</button>)}
      </div>
      <p className="mt-4 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-[12px]"><span className="mr-2 rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-medium text-accent">Coming soon</span>Integrations are not live in this demo. Browse what will be available.</p>

      {tab === 'connected' ? (
        <div className="py-24 text-center"><p className="font-medium">No integrations connected</p><p className="mt-1 text-mute">Connected integrations will appear here.</p></div>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {PRIMARY_FILTERS.map(f => <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f} className={cx('rounded-md border px-3 py-1 text-[12px]', filter === f ? 'border-accent bg-accent/15' : 'border-line hover:bg-hover')}>{f}</button>)}
            <div ref={ref} className="relative">
              <button onClick={() => setMore(m => !m)} aria-expanded={more} className={cx('flex items-center gap-1 rounded-md border px-3 py-1 text-[12px]', isMore ? 'border-accent bg-accent/15' : 'border-line hover:bg-hover')}>{isMore ? filter : 'More'}<ChevronDown className="h-3 w-3" /></button>
              {more && <div className="menu absolute left-0 top-full z-30 mt-1 w-44 p-1">{MORE_FILTERS.map(f => <button key={f} className="menu-item" onClick={() => { setFilter(f); setMore(false); }}>{f}</button>)}</div>}
            </div>
            <label className="relative ml-auto"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mute" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search" aria-label="Search integrations" className="input w-52 pl-8" /></label>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map(i => (
              <button key={i.name} onClick={() => comingSoon(`${i.name} integration`)} className="rounded-lg border border-line bg-card p-4 text-left hover:bg-hover">
                <span className="flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold text-white" style={{ background: i.color }}>{i.name[0]}</span>
                <p className="mt-2 text-[13px] font-medium">{i.name}</p><p className="text-[11px] text-mute">{i.by}</p>
                <p className="mt-1.5 line-clamp-3 text-[12px] text-mute">{i.desc}</p>
              </button>))}
            {list.length === 0 && <p className="col-span-full py-16 text-center text-mute">No integrations match your search</p>}
          </div>
        </>
      )}
    </div>
  );
}
