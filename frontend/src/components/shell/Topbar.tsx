'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarPlus, ChevronDown, Menu, Mic, Search, Upload, Video } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { useClickOutside } from '@/lib/hooks';
import Notifications from './Notifications';

const titles: [string, string][] = [['/meetings', 'Meetings'], ['/tasks', 'Tasks'], ['/askfred', 'AskFred'], ['/uploads', 'Uploads'], ['/ai-skills', 'AI Skills'],
  ['/analytics', 'Analytics'], ['/voice-agents', 'Voice Agents'], ['/upgrade', 'Plan'], ['/integrations', 'Integrations'], ['/settings', 'Settings'], ['/email-assistant', 'Email Assistant']];

export default function Topbar({ onMenu }: { onMenu?: () => void }) {
  const path = usePathname();
  const router = useRouter();
  const { me, openModal } = useApp();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setMenu(false), menu);
  const title = path === '/' ? 'Home' : titles.find(([p]) => path.startsWith(p))?.[1] ?? '';
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);
  const left = me?.free_meetings_left ?? 3;
  const go = (fn: () => void) => () => { setMenu(false); fn(); };

  return (
    <header className="relative z-20 flex h-12 shrink-0 items-center gap-2 border-b border-line bg-bg px-3 sm:gap-3 sm:px-4">
      <button onClick={onMenu} aria-label="Open menu" className="rounded p-1.5 text-mute hover:bg-hover hover:text-ink md:hidden"><Menu className="h-4 w-4" /></button>
      <h1 className="hidden w-40 truncate text-[13px] text-mute md:block">{title}</h1>
      <button onClick={() => openModal('search')} className="mx-auto flex h-8 w-full max-w-[400px] items-center gap-2 rounded-md border border-line bg-hover/40 px-3 text-mute hover:bg-hover/70" aria-label="Search">
        <Search className="h-3.5 w-3.5 shrink-0" /><span className="min-w-0 flex-1 truncate text-left">Search by title or keyword</span><kbd className="hidden text-[11px] sm:inline">{isMac ? '⌘' : 'Ctrl'} + K</kbd>
      </button>
      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
        <span className="hidden items-center gap-1.5 text-[12px] md:flex"><span className="flex h-4 w-4 items-center justify-center rounded bg-good/20 text-[10px] font-bold text-good">{left}</span>Free meetings</span>
        <Link href="/upgrade" className="hidden rounded-md border border-good/60 bg-good/10 px-2.5 py-1 text-[12px] font-medium text-good hover:bg-good/20 sm:block">Upgrade</Link>
        <Notifications />
        <div ref={ref} className="relative">
          <div className="flex overflow-hidden rounded-md bg-accent text-accent-ink">
            <button onClick={() => openModal('live')} title="Capture live meeting" className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium hover:brightness-110"><Video className="h-3.5 w-3.5" /><span className="hidden sm:inline">Capture</span></button>
            <button onClick={() => setMenu(m => !m)} aria-label="Capture options" className="border-l border-white/20 px-1.5 hover:brightness-110"><ChevronDown className="h-3.5 w-3.5" /></button>
          </div>
          {menu && (
            <div className="menu absolute right-0 top-full z-50 mt-1 w-52 p-1">
              <button className="menu-item" onClick={go(() => openModal('live'))}><Video className="h-3.5 w-3.5 text-mute" />Add to live meeting</button>
              <button className="menu-item" onClick={go(() => openModal('schedule'))}><CalendarPlus className="h-3.5 w-3.5 text-mute" />Schedule new meeting</button>
              <button className="menu-item" onClick={go(() => router.push('/uploads'))}><Upload className="h-3.5 w-3.5 text-mute" />Upload audio or video</button>
              <button className="menu-item" onClick={go(() => openModal('record'))}><Mic className="h-3.5 w-3.5 text-mute" />Start recording</button>
            </div>)}
        </div>
      </div>
    </header>
  );
}
