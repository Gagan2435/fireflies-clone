'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * One player API for both modes:
 *  - mediaUrl set  -> drives a real <audio> element (attach audioRef)
 *  - no mediaUrl   -> simulated clock (the assignment allows a placeholder player)
 */
export function usePlayer(duration: number, mediaUrl: string | null) {
  const [time, setTimeState] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRateState] = useState(1);
  const [epoch, setEpoch] = useState(0);   // bumps on every seek so the simulated clock restarts from the new position
  const timeRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const setTime = useCallback((t: number) => { timeRef.current = t; setTimeState(t); }, []);

  useEffect(() => {                     // simulated clock
    if (mediaUrl || !playing) return;
    const t0 = performance.now(), base = timeRef.current;
    const id = setInterval(() => {
      const n = base + ((performance.now() - t0) / 1000) * rate;
      if (n >= duration) { setTime(duration); setPlaying(false); } else setTime(n);
    }, 100);
    return () => clearInterval(id);
  }, [playing, rate, duration, mediaUrl, setTime, epoch]);

  const seek = useCallback((t: number) => {
    const c = Math.min(Math.max(0, t), duration);
    setTime(c);
    setEpoch(e => e + 1);
    if (audioRef.current) audioRef.current.currentTime = c;
  }, [duration, setTime]);

  const play = useCallback(() => {
    if (timeRef.current >= duration) seek(0);
    audioRef.current?.play().catch(() => setPlaying(false));
    setPlaying(true);
  }, [duration, seek]);
  const pause = useCallback(() => { audioRef.current?.pause(); setPlaying(false); }, []);
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, play, pause]);
  const setRate = useCallback((r: number) => { setRateState(r); if (audioRef.current) audioRef.current.playbackRate = r; }, []);

  const audioProps = mediaUrl ? {
    ref: audioRef, src: mediaUrl, preload: 'metadata' as const,
    onTimeUpdate: () => audioRef.current && setTime(audioRef.current.currentTime),
    onEnded: () => setPlaying(false),
  } : null;

  return { time, playing, rate, seek, play, pause, toggle, setRate, audioProps, simulated: !mediaUrl };
}
