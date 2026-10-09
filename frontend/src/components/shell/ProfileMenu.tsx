'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { Apple, Chrome, Download, Gift, KeyRound, ListMusic, LogOut, Monitor, Moon, Play, ScrollText, Smartphone, Sun, Users, Zap } from 'lucide-react';
import { useApp, ThemePref } from '@/lib/app-context';
import { useClickOutside } from '@/lib/hooks';

const next: Record<ThemePref, ThemePref> = { dark: 'light', light: 'system', system: 'dark' };
const label: Record<ThemePref, string> = { dark: 'Dark', light: 'Light', system: 'System' };
const ThemeIcon = { dark: Moon, light: Sun, system: Monitor };

export default function ProfileMenu({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { me, theme, setTheme, comingSoon } = useApp();
  useClickOutside(ref, onClose);
  const T = ThemeIcon[theme];
  const soon = (w: string) => () => { comingSoon(w); onClose(); };
  const left = me?.free_meetings_left ?? 3;
  return (
    <div ref={ref} className="absolute left-2 top-full z-50 flex gap-1.5">
      <div className="menu w-[224px] p-2">
        <p className="px-2.5 pt-1 text-[13px] font-semibold">Hi {me?.name ?? 'there'}</p>
        <p className="px-2.5 pb-2 text-[11px] text-mute">{me?.email}</p>
        <div className="px-2.5 pb-2">
          <p className="text-[12px] font-medium">{me?.plan ?? 'Free'}</p>
          <div className="mt-1 h-1 rounded-full bg-hover"><div className="h-1 rounded-full bg-good" style={{ width: `${(left / 3) * 100}%` }} /></div>
          <p className="mt-1 text-[11px] text-mute">{left} left / 3 free meetings</p>
          <Link href="/upgrade" onClick={onClose} className="mt-2 flex items-center justify-center gap-1 rounded-md bg-good/15 py-1 text-[12px] font-medium text-good"><Zap className="h-3 w-3" />Upgrade</Link>
        </div>
        <div className="border-t border-line px-2.5 py-2"><p className="text-[12px] font-medium">Storage</p><p className="text-[11px] text-mute">{me?.storage_used_mb ?? 0} / {me?.storage_total_mb ?? 400} mins</p></div>
        <div className="border-t border-line pt-1">
          <button className="menu-item" onClick={soon('Refer and Earn')}><Gift className="h-3.5 w-3.5 text-mute" />Refer and Earn $5</button>
          <button className="menu-item" onClick={soon('Playlists')}><ListMusic className="h-3.5 w-3.5 text-mute" />Playlist</button>
          <button className="menu-item" onClick={soon('Teams')}><Users className="h-3.5 w-3.5 text-mute" />My Team</button>
          <button className="menu-item" onClick={soon('Web logins')}><KeyRound className="h-3.5 w-3.5 text-mute" />Manage Web Logins</button>
          <button className="menu-item" onClick={soon('Platform rules')}><ScrollText className="h-3.5 w-3.5 text-mute" />Platform Rules</button>
          <button className="menu-item" onClick={() => setTheme(next[theme])}>
            <T className="h-3.5 w-3.5 text-mute" />Theme <span className="rounded bg-accent/20 px-1 text-[9px] font-semibold text-accent">BETA</span>
            <span className="ml-auto text-[11px] text-mute">{label[theme]}</span>
          </button>
          <button className="menu-item" onClick={soon('Sign out (a default user is always logged in)')}><LogOut className="h-3.5 w-3.5 text-mute" />Logout</button>
        </div>
      </div>
      <div className="menu hidden w-[220px] self-start p-2 md:block">
        <div className="rounded-md p-2.5"><div className="flex items-center gap-2 text-[12px] font-medium"><Smartphone className="h-3.5 w-3.5" />Mobile App</div>
          <p className="mt-1 text-[11px] text-mute">Transcribe and summarize in-person conversations with mobile app.</p>
          <div className="mt-2 flex gap-2"><button aria-label="App Store" onClick={soon('The mobile app')} className="rounded bg-hover p-1.5"><Apple className="h-3.5 w-3.5" /></button><button aria-label="Google Play" onClick={soon('The mobile app')} className="rounded bg-hover p-1.5"><Play className="h-3.5 w-3.5" /></button></div></div>
        <div className="rounded-md p-2.5"><div className="flex items-center gap-2 text-[12px] font-medium"><Chrome className="h-3.5 w-3.5" />Chrome Extension</div>
          <p className="mt-1 text-[11px] text-mute">Record and transcribe Google Meet calls without Fireflies notetaker bot.</p>
          <button onClick={soon('The Chrome extension')} className="btn-ghost mt-2">Install</button></div>
        <button onClick={soon('The desktop app')} className="menu-item mt-1 bg-hover/50 py-2"><Download className="h-3.5 w-3.5" />Download Fireflies Desktop App</button>
      </div>
    </div>
  );
}
