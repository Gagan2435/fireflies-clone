'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Bot, ChevronDown, Download, Headphones, Home, Layers, ListChecks, Mail, PanelLeftClose, PanelLeftOpen,
  Settings, Sparkles, Video, X, Zap } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { useStoredState } from '@/lib/hooks';
import { cx, getInitials } from '@/lib/utils';
import ProfileMenu from './ProfileMenu';

type Item = { href: string; label: string; icon: typeof Home; tag?: string; accentIcon?: boolean };
const groups: Item[][] = [
  [{ href: '/', label: 'Home', icon: Home }, { href: '/askfred', label: 'AskFred', icon: Bot, accentIcon: true }],
  [{ href: '/meetings', label: 'Meetings', icon: Video }, { href: '/tasks', label: 'Tasks', icon: ListChecks }, { href: '/ai-skills', label: 'AI Skills', icon: Sparkles }],
  [{ href: '/analytics', label: 'Analytics', icon: BarChart3 }, { href: '/voice-agents', label: 'Voice Agents', icon: Headphones }],
  [{ href: '/upgrade', label: 'Upgrade', icon: Zap, tag: '40% OFF' }],
];
const footer: Item[] = [{ href: '/integrations', label: 'Integrations', icon: Layers }, { href: '/settings', label: 'Settings', icon: Settings }];

export default function Sidebar() {
  const path = usePathname();
  const { me, comingSoon } = useApp();
  const [mode, setMode] = useStoredState<'full' | 'rail'>('sidebar', 'full');
  const [profile, setProfile] = useState(false);
  const [slide, setSlide] = useState(0);
  const [promo, setPromo] = useStoredState<'on' | 'off'>('sidebar-promo', 'on');
  const rail = mode === 'rail';
  const name = me?.name ?? 'User';
  const active = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

  const link = (it: Item) => (
    <Link key={it.href} href={it.href} title={rail ? it.label : undefined}
      className={cx('flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] transition-colors', rail && 'justify-center px-0',
        active(it.href) ? 'bg-hover text-ink' : 'text-mute hover:bg-hover/60 hover:text-ink')}>
      <it.icon className={cx('h-4 w-4 shrink-0', it.accentIcon && 'text-accent')} />
      {!rail && <span className="flex-1">{it.label}</span>}
      {!rail && it.tag && <span className="text-[10px] font-semibold text-good">{it.tag}</span>}
    </Link>
  );

  return (
    <aside className={cx('flex shrink-0 flex-col border-r border-line bg-panel transition-[width]', rail ? 'w-[52px]' : 'w-[200px]')}>
      <div className="relative flex items-center gap-1 p-2.5">
        <button onClick={() => setProfile(p => !p)} className="flex min-w-0 flex-1 items-center gap-2 rounded-md p-1 hover:bg-hover" aria-label="Account menu" aria-expanded={profile}>
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-hover text-[10px] font-bold">{getInitials(name).slice(0, 1)}</span>
          {!rail && <><span className="truncate text-[12px] font-semibold uppercase tracking-wide">{name}</span><ChevronDown className="h-3 w-3 text-mute" /></>}
        </button>
        {profile && <ProfileMenu onClose={() => setProfile(false)} />}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-2">
        {groups.map((g, i) => (
          <div key={i} className={cx('space-y-0.5', i > 0 && 'border-t border-line pt-1')}>
            {g.map(link)}
            {i === groups.length - 1 && (
              <Link href="/email-assistant" title="Try Email Assistant" className={cx('mt-1 flex items-center gap-2 rounded-md bg-accent/15 px-2.5 py-[7px] text-[13px] font-medium text-ink', rail && 'justify-center px-0')}>
                <Mail className="h-4 w-4 text-[#ea4335]" />{!rail && 'Try Email Assistant'}
              </Link>)}
          </div>
        ))}
        <div className="space-y-0.5 border-t border-line pt-1">{footer.map(link)}</div>
      </nav>

      {!rail && promo === 'on' && (
        <div className="m-2 rounded-lg border border-line bg-card p-3">
          <div className="flex justify-end"><button onClick={() => setPromo('off')} aria-label="Dismiss" className="text-mute hover:text-ink"><X className="h-3 w-3" /></button></div>
          {slide === 0 ? (
            <><p className="text-[12px] font-medium leading-snug">Invite coworkers to your Fireflies team</p>
              <button onClick={() => comingSoon('Teams')} className="btn-primary mt-2.5 w-full">Create Team</button></>
          ) : (
            <><p className="text-[12px] font-medium leading-snug">Bot-less meetings with Desktop App</p>
              <button onClick={() => comingSoon('The desktop app')} className="btn-primary mt-2.5 w-full"><Download className="h-3.5 w-3.5" />Download</button></>
          )}
          <div className="mt-2 flex justify-center gap-1">{[0, 1].map(i => (
            <button key={i} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} className={cx('h-1 rounded-full', slide === i ? 'w-3 bg-ink' : 'w-1 bg-mute/50')} />))}</div>
        </div>
      )}
      <button onClick={() => setMode(rail ? 'full' : 'rail')} className="m-2 flex items-center justify-center gap-2 rounded-md p-1.5 text-mute hover:bg-hover hover:text-ink" aria-label={rail ? 'Expand sidebar' : 'Collapse sidebar'}>
        {rail ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" /><span className="text-[12px]">Collapse</span></>}
      </button>
    </aside>
  );
}
