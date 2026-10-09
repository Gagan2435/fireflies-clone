'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Apple, CalendarDays, ChevronRight, Download, Monitor, Play, Plus, Smartphone, Sparkles, Upload, Video } from 'lucide-react';
import { api } from '@/lib/api';
import { useApp } from '@/lib/app-context';
import { cx, formatListDate } from '@/lib/utils';
import type { MeetingListItem } from '@/lib/types';

const SKILLS = [['1:1', '397.3k', 'bg-emerald-500'], ['Idea Generator', '354k', 'bg-teal-500'], ['Daily Standups', '234.9k', 'bg-indigo-400']];

export default function Home() {
  const router = useRouter();
  const { me, openModal, comingSoon, version } = useApp();
  const [tab, setTab] = useState<'Recent' | 'Upcoming' | 'AI Feed'>('Recent');
  const [recent, setRecent] = useState<MeetingListItem[] | null>(null);
  const [on, setOn] = useState<Record<string, boolean>>({});
  useEffect(() => { api.meetings({ sort_by: 'recency' }).then(r => setRecent(r.slice(0, 5))).catch(() => setRecent([])); }, [version]);

  const tiles = [
    { label: 'Schedule Meeting', icon: CalendarDays, cls: 'bg-[#4a1d2e] text-[#f0a3b8]', go: () => openModal('schedule') },
    { label: 'Upload File', icon: Upload, cls: 'bg-[#16382e] text-[#7fd8b4]', go: () => router.push('/uploads') },
    { label: 'Capture Meeting', icon: Plus, cls: 'bg-[#1e1b4b] text-[#a5a0f5]', go: () => openModal('live') },
  ];
  return (
    <div className="mx-auto w-full max-w-[780px] px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <section className="flex items-center justify-between gap-6 rounded-2xl bg-[#3b2210] px-6 py-7 text-white sm:px-12 sm:py-9">
        <div><h1 className="text-[20px] font-semibold">Welcome Aboard, {(me?.name ?? 'there').toUpperCase()}!</h1>
          <p className="mt-2 max-w-[240px] text-[13px] text-white/60">Fireflies is now ready to automate your meetings and streamline your workflows.</p></div>
        <button onClick={() => comingSoon('The product demo video')} aria-label="Play intro video" className="relative hidden h-[88px] w-[150px] shrink-0 items-center justify-center rounded-lg border-2 border-amber-100/80 bg-gradient-to-br from-[#2a1a6e] to-[#14102e] sm:flex">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500"><Play className="ml-0.5 h-3.5 w-3.5 fill-white" /></span></button>
      </section>

      <h2 className="mt-9 text-[15px] font-semibold">Quick Start</h2>
      <p className="mt-1 text-mute">Capture your first meeting or upload a recording to see Fireflies in action.</p>
      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {tiles.map(t => (
          <button key={t.label} onClick={t.go} className={cx('flex items-center gap-2.5 rounded-lg px-4 py-3.5 text-left text-[13px] font-medium transition-[filter] hover:brightness-125', t.cls)}>
            <t.icon className="h-4 w-4" /><span className="flex-1 text-ink">{t.label}</span><ChevronRight className="h-3.5 w-3.5 text-mute" /></button>))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex rounded-md bg-hover/60 p-0.5" role="tablist">
          {(['Recent', 'Upcoming', 'AI Feed'] as const).map(t => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cx('rounded px-3 py-1 text-[12px]', tab === t ? 'bg-card font-medium shadow-sm' : 'text-mute hover:text-ink')}>{t}</button>))}
        </div>
        <button onClick={() => openModal('meetingSettings')} className="inline-flex items-center gap-1.5 text-[12px] text-mute hover:text-ink"><CalendarDays className="h-3.5 w-3.5" />Settings</button>
      </div>

      <div className="mt-3 min-h-[120px]">
        {tab === 'Recent' && (recent === null ? <div className="h-16 animate-pulse rounded-lg bg-hover/50" /> : recent.length === 0 ? (
          <p className="py-10 text-center text-mute">No meetings yet. <Link href="/uploads" className="text-accent hover:underline">Add a transcript</Link> to get started.</p>
        ) : (<div className="space-y-2">{recent.map(m => (
          <Link key={m.id} href={`/meetings/${m.id}`} className="flex items-center gap-3 rounded-lg border border-line bg-card px-4 py-3 hover:border-accent/50 hover:bg-hover/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-pink-600/90 text-white"><Video className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium">{m.title}</span><span className="text-[12px] text-mute">{formatListDate(m.date)}</span></span>
            <ChevronRight className="h-4 w-4 text-mute" /></Link>))}
          <Link href="/meetings" className="block pt-1 text-center text-[12px] text-accent hover:underline">View all meetings</Link></div>))}
        {tab === 'Upcoming' && (
          <div className="py-8 text-center"><p className="font-medium">No upcoming meeting scheduled</p><p className="mx-auto mt-1 max-w-[260px] text-mute">Schedule a meeting on your calendar or transcribe a live meeting.</p>
            <button onClick={() => openModal('live')} className="btn-primary mt-4 px-8"><Plus className="h-3.5 w-3.5" />Capture</button></div>)}
        {tab === 'AI Feed' && (
          <div className="py-4 text-center"><span className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/20 text-pink-400"><Sparkles className="h-4 w-4" /></span>
            <p className="mt-3 font-medium">Extract specific insights from your meetings ✨</p>
            <div className="mx-auto mt-4 max-w-[380px] rounded-lg border border-line bg-card p-3 text-left">
              <p className="mb-2 text-[11px] text-mute">Recommended Skills</p>
              {SKILLS.map(([n, c, col]) => (
                <div key={n} className="flex items-center gap-2.5 py-1.5"><span className={cx('flex h-5 w-5 items-center justify-center rounded text-[12px] font-bold text-white', col)}>+</span><span className="flex-1 text-[13px]">{n}</span>
                  <span className="text-[11px] text-mute">✧ {c}</span>
                  <button role="switch" aria-checked={!!on[n]} aria-label={`Enable ${n}`} onClick={() => { setOn(o => ({ ...o, [n]: !o[n] })); comingSoon('AI Skills'); }} className={cx('relative h-4 w-7 rounded-full', on[n] ? 'bg-accent' : 'bg-hover')}><span className={cx('absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all', on[n] ? 'left-[14px]' : 'left-0.5')} /></button></div>))}
              <Link href="/ai-skills" className="mt-1 inline-block text-[12px] text-mute hover:text-ink">View All ›</Link></div></div>)}
      </div>

      <h2 className="mt-10 text-[15px] font-semibold">Try More</h2>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <div className="card p-4"><Monitor className="h-4 w-4 text-accent" /><p className="mt-3 text-[13px] font-medium">Desktop App</p><p className="mt-1 text-mute">Capture conversations without any bot present in your meeting.</p>
          <button onClick={() => comingSoon('The desktop app')} className="btn-primary mt-3"><Download className="h-3.5 w-3.5" />Download</button></div>
        <div className="card p-4"><Smartphone className="h-4 w-4 text-red-400" /><p className="mt-3 text-[13px] font-medium">Mobile App</p><p className="mt-1 text-mute">Record in-person conversations and review meetings on the go.</p>
          <div className="mt-3 flex gap-2"><button aria-label="App Store" onClick={() => comingSoon('The mobile app')} className="rounded bg-hover p-2"><Apple className="h-4 w-4" /></button><button aria-label="Google Play" onClick={() => comingSoon('The mobile app')} className="rounded bg-hover p-2"><Play className="h-4 w-4" /></button></div></div>
      </div>
    </div>
  );
}
