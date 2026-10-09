'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { api } from './api';
import type { Me } from './types';

export type ThemePref = 'light' | 'dark' | 'system';
export type ModalName = 'search' | 'live' | 'schedule' | 'record' | 'meetingSettings' | null;

interface Ctx {
  me: Me | null;
  theme: ThemePref;
  setTheme: (t: ThemePref) => void;
  modal: ModalName;
  openModal: (m: ModalName) => void;
  closeModal: () => void;
  comingSoon: (what?: string) => void;
  /** bump to make list views refetch after create/delete */
  version: number;
  refresh: () => void;
}
const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp outside AppProvider');
  return c;
};

const read = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } };

function applyTheme(pref: ThemePref) {
  const dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('light', !dark);
  document.documentElement.classList.toggle('dark', dark);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [theme, setThemeState] = useState<ThemePref>('dark');
  const [modal, setModal] = useState<ModalName>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const saved = (read('theme') as ThemePref) || 'dark';
    setThemeState(saved);
    applyTheme(saved);
    api.me().then(setMe).catch(() => setMe(null));
  }, []);

  useEffect(() => {          // follow the OS when the preference is "system"
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const fn = () => applyTheme('system');
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [theme]);

  useEffect(() => {          // global Ctrl/Cmd+K
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setModal(m => (m === 'search' ? null : 'search')); }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  const setTheme = useCallback((t: ThemePref) => { setThemeState(t); write('theme', t); applyTheme(t); }, []);
  const comingSoon = useCallback((what?: string) => toast(`${what ? what + ' is' : 'This is'} coming soon`, { icon: '🚧' }), []);
  const closeModal = useCallback(() => setModal(null), []);
  const refresh = useCallback(() => setVersion(v => v + 1), []);

  const value = useMemo<Ctx>(() => ({
    me, theme, setTheme, modal, openModal: setModal, closeModal, comingSoon, version, refresh,
  }), [me, theme, setTheme, modal, closeModal, comingSoon, version, refresh]);
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
