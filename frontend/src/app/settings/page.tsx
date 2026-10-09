'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Bell, ChevronDown, Code2, Cookie, Gift, Contact, Mail, MessageSquare, Monitor, Palette, Radio, ScrollText, Search, Sparkles, Users, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '@/lib/app-context';
import { cx, getInitials } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import { AccountPanel, AppearancePanel, RecordingPanel, SoonPanel } from '@/components/settings/Panels';

type Scope = 'personal' | 'team';
interface Nav { id: string; label: string; icon: typeof Video; soon?: string; group?: number }
const personal: Nav[] = [
  { id: 'appearance', label: 'Language & Appearance', icon: Palette }, { id: 'recording', label: 'Recording & Privacy', icon: Video },
  { id: 'compliance', label: 'Compliance Notification', icon: Bell, soon: 'Compliance notifications let you tell participants that the meeting is being recorded.' },
  { id: 'email', label: 'Email Assistant', icon: Mail, soon: 'The Email Assistant drafts replies and follow-ups and labels your inbox.' },
  { id: 'ai', label: 'AI Settings', icon: Sparkles, soon: 'Choose the models and instructions that shape your summaries.' },
  { id: 'live', label: 'Live Assist', icon: Radio, soon: 'Live Assist needs a real-time bot in the call, which is out of scope for this demo.' },
  { id: 'kb', label: 'Knowledge Base', icon: BookOpen, soon: 'Add company knowledge to power smarter AI answers.' },
  { id: 'mcp', label: 'MCP & API', icon: Code2, soon: 'API keys and MCP connections for other tools.', group: 1 },
  { id: 'cookies', label: 'Cookies', icon: Cookie, soon: 'Cookie preferences. This demo only stores your theme and settings in this browser.', group: 1 },
  { id: 'refer', label: 'Refer and earn $5 each', icon: Gift, soon: 'Invite friends and earn credit.', group: 2 },
  { id: 'account', label: 'Account', icon: Contact, group: 2 },
];
const team: Nav[] = [
  { id: 'recording', label: 'Recording & Privacy', icon: Video, soon: 'Team-wide recording defaults.' },
  { id: 'compliance', label: 'Compliance Notification', icon: Bell, soon: 'Team-wide compliance notices.' },
  { id: 'ai', label: 'AI Settings', icon: Sparkles, soon: 'Team-wide AI settings.' },
  { id: 'live', label: 'Live Meeting', icon: Radio, soon: 'Live meeting controls for the team.' },
  { id: 'rules', label: 'Rules', icon: ScrollText, soon: 'Team recording and restriction rules.' },
  { id: 'people', label: 'Teammates and groups', icon: Users, soon: 'Invite teammates and manage user groups. Collaboration is out of scope for this demo.' },
];

export default function SettingsPage() {
  const { me } = useApp();
  const [scope, setScope] = useState<Scope>('personal');
  const [tab, setTab] = useState('recording');
  const [fyi, setFyi] = useState(false);
  const [q, setQ] = useState('');
  const items = scope === 'personal' ? personal : team;
  const shown = q.trim() ? items.filter(i => i.label.toLowerCase().includes(q.trim().toLowerCase())) : items;
  const current = items.find(i => i.id === tab) ?? items[0];

  const switchScope = (s: Scope) => { setScope(s); setTab('recording'); setQ(''); if (s === 'team') setFyi(true); };

  let body;
  if (scope === 'personal' && current.id === 'appearance') body = <AppearancePanel />;
  else if (scope === 'personal' && current.id === 'recording') body = <RecordingPanel />;
  else if (scope === 'personal' && current.id === 'account') body = <AccountPanel />;
  else body = <SoonPanel title={current.label} description={current.soon ?? ''} />;

  return (
    <div className="flex min-h-0 flex-1">
      <nav aria-label="Settings" className="flex w-[240px] shrink-0 flex-col border-r border-line bg-panel p-3">
        <Link href="/" aria-label="Back to app" className="mb-2 w-fit rounded p-1 text-mute hover:bg-hover hover:text-ink"><ArrowLeft className="h-4 w-4" /></Link>
        <div className="mb-3 flex items-center gap-2 px-1">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-hover text-[11px] font-bold">{getInitials(me?.name).slice(0, 1)}</span>
          <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-medium">{me?.email}</p><p className="text-[11px] text-mute">{me?.plan ?? 'Free'} Plan</p></div>
          <ChevronDown className="h-3 w-3 text-mute" />
        </div>
        <div className="mb-3 flex rounded-md bg-hover/60 p-0.5 text-[12px]">
          {(['personal', 'team'] as const).map(k => <button key={k} onClick={() => switchScope(k)} aria-pressed={scope === k} className={cx('flex-1 rounded px-3 py-1 capitalize', scope === k ? 'bg-card font-medium shadow-sm' : 'text-mute')}>{k}</button>)}
        </div>
        <div className="space-y-0.5 overflow-y-auto">
          {shown.map((it, i) => (
            <div key={it.id}>
              {i > 0 && shown[i - 1].group !== it.group && <div className="my-1.5 border-t border-line" />}
              <button onClick={() => setTab(it.id)} aria-current={current.id === it.id ? 'page' : undefined}
                className={cx('flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-left text-[13px]', current.id === it.id ? 'bg-hover text-ink' : 'text-mute hover:bg-hover/60 hover:text-ink', it.id === 'refer' && 'bg-accent/15 text-ink')}>
                <it.icon className="h-4 w-4 shrink-0" />{it.label}
              </button>
            </div>))}
          {shown.length === 0 && <p className="px-2.5 py-2 text-mute">No matching settings</p>}
        </div>
      </nav>

      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[640px] px-6 py-4">
          <div className="flex items-center justify-between">
            <label className="relative mx-auto block w-full max-w-[260px]"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mute" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search settings" aria-label="Search settings" className="input pl-8" /></label>
            <button onClick={() => toast('Thanks! Feedback is not collected in this demo', { icon: '💬' })} className="absolute right-6 flex items-center gap-1 text-[12px] text-mute hover:text-ink"><MessageSquare className="h-3 w-3" />Feedback</button>
          </div>
          {body}
        </div>
      </div>

      {fyi && (
        <Modal title="FYI: You're editing Teams settings" onClose={() => setFyi(false)}>
          <div className="p-5">
            <div className="flex h-24 items-center justify-center rounded-lg bg-accent/10"><Monitor className="h-8 w-8 text-accent" /></div>
            <p className="mt-3 text-[12px] text-mute">Anything you change here applies to everyone on your team. To manage your personal settings, switch to My Account.</p>
            <div className="mt-4 flex justify-end"><button className="btn-primary" onClick={() => setFyi(false)}>Got it</button></div>
          </div>
        </Modal>)}
    </div>
  );
}
