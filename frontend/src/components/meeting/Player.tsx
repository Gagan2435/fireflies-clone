'use client';
import { Pause, Play, RotateCcw, RotateCw } from 'lucide-react';
import type { usePlayer } from '@/lib/usePlayer';
import type { Chapter, Soundbite } from '@/lib/types';
import { formatTime } from '@/lib/utils';

const RATES = [1, 1.25, 1.5, 2];

export default function Player({ player, duration, title, chapters, soundbites }: {
  player: ReturnType<typeof usePlayer>; duration: number; title: string; chapters: Chapter[]; soundbites: Soundbite[];
}) {
  const { time, playing, toggle, seek, rate, setRate, simulated, audioProps } = player;
  const pct = duration ? (time / duration) * 100 : 0;
  return (
    <div className="border-b border-line bg-card">
      {audioProps && <audio {...audioProps} />}
      <div className="relative flex h-[120px] items-center justify-center overflow-hidden bg-gradient-to-br from-[#2a1a6e] via-[#3b1f8f] to-[#14102e]">
        <button onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-[#2a1a6e] shadow-pop transition-transform hover:scale-105">
          {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
        </button>
        <p className="absolute bottom-2 left-3 max-w-[70%] truncate text-[11px] text-white/80">{title}</p>
        {simulated && <span className="absolute right-3 top-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white/80" title="No audio file is attached to this meeting, so playback is simulated.">Sample playback</span>}
      </div>
      <div className="flex items-center gap-2 px-3 py-2">
        <button onClick={() => seek(time - 10)} aria-label="Back 10 seconds" className="rounded p-1 text-mute hover:bg-hover hover:text-ink"><RotateCcw className="h-4 w-4" /></button>
        <button onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} className="rounded p-1 hover:bg-hover">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
        <button onClick={() => seek(time + 10)} aria-label="Forward 10 seconds" className="rounded p-1 text-mute hover:bg-hover hover:text-ink"><RotateCw className="h-4 w-4" /></button>
        <span className="w-[84px] shrink-0 text-center text-[12px] tabular-nums text-mute">{formatTime(time)} / {formatTime(duration)}</span>
        <div className="relative flex h-5 flex-1 items-center">
          <input type="range" min={0} max={Math.max(1, Math.floor(duration))} step={1} value={Math.floor(time)} onChange={e => seek(Number(e.target.value))}
            aria-label="Seek" className="peer z-10 h-1 w-full cursor-pointer appearance-none rounded-full bg-hover accent-accent" style={{ background: `linear-gradient(to right, rgb(var(--accent)) ${pct}%, rgb(var(--hover)) ${pct}%)` }} />
          {chapters.map(c => duration > 0 && c.start_time > 0 && <span key={`c${c.id}`} title={c.title} className="pointer-events-none absolute top-0 h-2 w-px bg-mute/70" style={{ left: `${(c.start_time / duration) * 100}%` }} />)}
          {soundbites.map(s => duration > 0 && <span key={`s${s.id}`} title={`Soundbite: ${s.title}`} className="pointer-events-none absolute bottom-0 h-1.5 w-1.5 rounded-full bg-amber-400" style={{ left: `${(s.start_time / duration) * 100}%` }} />)}
        </div>
        <button onClick={() => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length])} aria-label="Playback speed" className="w-10 rounded bg-hover/70 py-0.5 text-[11px] font-medium hover:bg-hover">{rate}x</button>
      </div>
    </div>
  );
}
