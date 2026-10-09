'use client';
import { useCallback, useEffect, useState } from 'react';

/** Personal preferences. Persisted in the browser (there is no real auth/user table to hang them on). */
export interface Settings {
  autoRecord: boolean; autoRecordScope: string; captureVideo: boolean; meetingLanguage: string; autoDelete: boolean;
  meetingPrivacy: string; publicAccess: boolean; autoRequestAccess: boolean; recapRecipients: string; recapContent: string; prepEmail: string;
  notetakerName: string;
}
export const DEFAULT_SETTINGS: Settings = {
  autoRecord: true, autoRecordScope: 'Record all calendar events with a meeting link', captureVideo: false, meetingLanguage: 'English (Global)', autoDelete: false,
  meetingPrivacy: 'Teammates & anyone with link', publicAccess: false, autoRequestAccess: false, recapRecipients: 'Everyone on the invite', recapContent: 'Overview',
  prepEmail: 'Send to all participants', notetakerName: 'Fireflies.ai Notetaker',
};
const KEY = 'settings.v1';

export function useSettings(): [Settings, (p: Partial<Settings>) => void] {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setS({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) }); } catch { /* corrupt or blocked storage: keep defaults */ }
  }, []);
  const patch = useCallback((p: Partial<Settings>) => {
    setS(prev => { const next = { ...prev, ...p }; try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ } return next; });
  }, []);
  return [s, patch];
}
