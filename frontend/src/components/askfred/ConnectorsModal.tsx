'use client';
import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { cx } from '@/lib/utils';
import Modal from '@/components/ui/Modal';

const CONNECTORS = [
  ['Asana', 'Create tasks in Asana from AI assistant', '#f06a6a'], ['ClickUp', 'Create tasks in ClickUp from AI assistant', '#7b68ee'],
  ['Gmail', 'Pull emails, auto-create labels, auto-draft replies', '#ea4335'], ['Google Docs', 'Automatically push meeting notes to Docs', '#4285f4'],
  ['Google Drive', 'Automatically save Fireflies meeting notes', '#34a853'], ['Google Sheets', 'Automatically log meeting insights to Sheets', '#0f9d58'],
  ['Notion', 'Send meeting notes to Notion pages', '#9ca3af'], ['Slack', 'Receive summaries and answers in Slack', '#e01e5a'],
] as const;

/** Catalogue only: connecting real third-party services is a listed placeholder in the assignment. */
export default function ConnectorsModal({ onClose }: { onClose: () => void }) {
  const { comingSoon } = useApp();
  const [tab, setTab] = useState<'all' | 'connected'>('all');
  const [q, setQ] = useState('');
  const list = tab === 'connected' ? [] : CONNECTORS.filter(c => (c[0] + c[1]).toLowerCase().includes(q.toLowerCase()));
  return (
    <Modal title="Add Connectors" onClose={onClose} width="max-w-[560px]">
      <div className="p-5 pt-3">
        <div className="flex items-center gap-2">
          <div className="flex rounded-md bg-hover/60 p-0.5 text-[12px]">{(['all', 'connected'] as const).map(k => <button key={k} onClick={() => setTab(k)} className={cx('rounded px-3 py-1 capitalize', tab === k ? 'bg-card font-medium shadow-sm' : 'text-mute')}>{k}</button>)}</div>
          <button className="btn-ghost ml-auto" onClick={() => comingSoon('Custom connectors')}><Plus className="h-3.5 w-3.5" />Custom Connector</button>
        </div>
        <label className="relative mt-3 block"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mute" /><input className="input pl-8" placeholder="Search connectors" aria-label="Search connectors" value={q} onChange={e => setQ(e.target.value)} /></label>
        <div className="mt-3 grid max-h-[340px] grid-cols-2 gap-2 overflow-y-auto">
          {list.map(([name, desc, color]) => (
            <button key={name} onClick={() => comingSoon(`${name} connector`)} className="rounded-lg border border-line bg-card p-3 text-left hover:bg-hover">
              <span className="flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold text-white" style={{ background: color }}>{name[0]}</span>
              <p className="mt-2 text-[13px] font-medium">{name}</p><p className="mt-0.5 line-clamp-2 text-[12px] text-mute">{desc}</p>
            </button>))}
          {list.length === 0 && <p className="col-span-2 py-10 text-center text-mute">{tab === 'connected' ? 'No connectors connected yet' : 'No connectors match your search'}</p>}
        </div>
      </div>
    </Modal>
  );
}
