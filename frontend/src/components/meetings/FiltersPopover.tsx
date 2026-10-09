'use client';
import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { api } from '@/lib/api';
import { useClickOutside } from '@/lib/hooks';
import type { MeetingFilters, Participant, Tag } from '@/lib/types';

const RANGES: [NonNullable<MeetingFilters['date_range']>, string][] = [['', 'Any time'], ['today', 'Today'], ['week', 'Past 7 days'], ['month', 'Past 30 days'], ['quarter', 'Past 90 days']];
const SORTS: [NonNullable<MeetingFilters['sort_by']>, string][] = [['recency', 'Most recent'], ['duration', 'Longest'], ['title', 'Title (A–Z)']];

export const activeFilterCount = (f: MeetingFilters) => [f.participant, f.tag, f.date_range, f.sort_by && f.sort_by !== 'recency'].filter(Boolean).length;

export default function FiltersPopover({ value, onChange }: { value: MeetingFilters; onChange: (f: MeetingFilters) => void }) {
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState<Participant[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);
  useEffect(() => { if (open) { api.participants().then(setPeople).catch(() => undefined); api.tags().then(setTags).catch(() => undefined); } }, [open]);
  const n = activeFilterCount(value);
  const set = (p: Partial<MeetingFilters>) => onChange({ ...value, ...p });

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} className="btn-outline" aria-expanded={open}><SlidersHorizontal className="h-3.5 w-3.5" />Filters{n > 0 && <span className="rounded-full bg-accent px-1.5 text-[10px] text-accent-ink">{n}</span>}</button>
      {open && (
        <div className="menu absolute left-0 top-full z-30 mt-1 w-64 space-y-3 p-3">
          <label className="block text-[12px] font-medium">Participant
            <select className="input mt-1" value={value.participant ?? ''} onChange={e => set({ participant: e.target.value })}>
              <option value="">Anyone</option>{people.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></label>
          <label className="block text-[12px] font-medium">Date
            <select className="input mt-1" value={value.date_range ?? ''} onChange={e => set({ date_range: e.target.value as MeetingFilters['date_range'] })}>
              {RANGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label className="block text-[12px] font-medium">Tag
            <select className="input mt-1" value={value.tag ?? ''} onChange={e => set({ tag: e.target.value })}>
              <option value="">Any tag</option>{tags.map(t => <option key={t.id} value={t.name}>#{t.name}</option>)}</select></label>
          <label className="block text-[12px] font-medium">Sort by
            <select className="input mt-1" value={value.sort_by ?? 'recency'} onChange={e => set({ sort_by: e.target.value as MeetingFilters['sort_by'] })}>
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <button className="btn-ghost w-full" onClick={() => onChange({ q: value.q })}>Clear filters</button>
        </div>)}
    </div>
  );
}
