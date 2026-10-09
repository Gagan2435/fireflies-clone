'use client';
import { RefObject, useEffect, useState } from 'react';

export function useClickOutside(ref: RefObject<HTMLElement>, onOut: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    const down = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onOut(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onOut(); };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [ref, onOut, active]);
}

export function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export function useStoredState<T extends string>(key: string, initial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(initial);
  useEffect(() => { try { const s = localStorage.getItem(key); if (s) setV(s as T); } catch { /* ignore */ } }, [key]);
  return [v, (n: T) => { setV(n); try { localStorage.setItem(key, n); } catch { /* ignore */ } }];
}
