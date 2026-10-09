'use client';
import { useState } from 'react';
import { Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import { useApp } from '@/lib/app-context';

const LANGS = ['English (Global)', 'English (US)', 'English (UK)', 'Spanish', 'French', 'German', 'Hindi', 'Portuguese'];
const Lang = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <select value={value} onChange={e => onChange(e.target.value)} className="input">{LANGS.map(l => <option key={l}>{l}</option>)}</select>
);

/** "Add to live meeting": the live bot is a placeholder per the assignment, so submitting says Coming soon. */
export function LiveModal() {
  const { closeModal, comingSoon } = useApp();
  const [lang, setLang] = useState(LANGS[0]);
  return (
    <Modal title="Add to live meeting" onClose={closeModal}>
      <div className="space-y-4 p-5">
        <label className="block"><span className="font-medium">Name your meeting</span> <span className="text-mute">(Optional)</span>
          <input className="input mt-1.5" placeholder="E.g. Product team sync" /></label>
        <div><p className="font-medium">Meeting link</p><p className="mb-1.5 text-mute">Capture meetings from GMeet, Zoom, MS teams, and more.</p>
          <div className="relative"><Link2 className="absolute left-3 top-2.5 h-3.5 w-3.5 text-mute" /><input className="input pl-9" placeholder="https://meet.google.com/abc-xyzh-moz" /></div></div>
        <div><p className="mb-1.5 font-medium">Meeting language</p><Lang value={lang} onChange={setLang} /></div>
        <div className="flex justify-end gap-2 pt-1"><button className="btn-ghost" onClick={closeModal}>Cancel</button>
          <button className="btn-primary" onClick={() => { closeModal(); comingSoon('Joining live meetings with the notetaker bot'); }}>Start Capturing</button></div>
      </div>
    </Modal>
  );
}

export function ScheduleModal() {
  const { closeModal, comingSoon } = useApp();
  const pick = (w: string) => () => { closeModal(); comingSoon(`${w} integration`); };
  return (
    <Modal title="Schedule Meeting" onClose={closeModal} width="max-w-[440px]">
      <div className="space-y-3 p-5">
        <p className="text-mute">Your AI Notetaker will be invited to the calendar meeting to record, transcribe and summarize.</p>
        <button onClick={pick('Google Calendar')} className="btn-outline w-full justify-center py-2.5"><span className="h-4 w-4 rounded bg-[#4285f4]" />Google Calendar</button>
        <button onClick={pick('Microsoft Outlook')} className="btn-outline w-full justify-center py-2.5"><span className="h-4 w-4 rounded bg-[#0078d4]" />Microsoft Outlook</button>
      </div>
    </Modal>
  );
}

export function RecordModal() {
  const { closeModal, comingSoon } = useApp();
  const [lang, setLang] = useState(LANGS[0]);
  const [remember, setRemember] = useState(false);
  return (
    <Modal onClose={closeModal} hideHeader width="max-w-[380px]">
      <div className="space-y-4 p-5">
        <h2 className="text-center text-[14px] font-semibold">Meeting Language</h2>
        <Lang value={lang} onChange={setLang} />
        <p className="text-[12px] text-mute">You can still change it from the menu while recording.</p>
        <label className="flex items-center gap-2"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-[rgb(var(--accent))]" />Remember my choice</label>
        <div className="grid grid-cols-2 gap-2"><button className="btn-ghost py-2" onClick={closeModal}>Cancel</button>
          <button className="btn-primary py-2" onClick={() => { closeModal(); comingSoon('In-browser recording and speech-to-text'); }}>Start Recording</button></div>
      </div>
    </Modal>
  );
}

const SETTINGS_KEY = 'meeting-settings';
const DEFAULTS = { unlimited: true, autoJoin: true, calendar: 'All meetings with web-conf link', recap: 'Everyone on the invite', privacy: 'Teammates & Anyone with Link', language: LANGS[0] };
type MS = typeof DEFAULTS;

/** Quick meeting settings from Home. Values really persist (localStorage) so "Saved" is truthful. */
export function MeetingSettingsModal() {
  const { closeModal } = useApp();
  const [s, setS] = useState<MS>(() => { try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; } catch { return DEFAULTS; } });
  const set = <K extends keyof MS>(k: K, v: MS[K]) => setS(p => ({ ...p, [k]: v }));
  const save = () => { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); toast.success('Meeting settings saved'); } catch { toast.error('Could not save settings'); } closeModal(); };
  const Toggle = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
    <button role="switch" aria-checked={on} aria-label={label} onClick={onClick} className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-hover'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} /></button>);
  const Sel = ({ value, opts, onChange, label }: { value: string; opts: string[]; onChange: (v: string) => void; label: string }) => (
    <select aria-label={label} className="input mt-1.5" value={value} onChange={e => onChange(e.target.value)}>{opts.map(o => <option key={o}>{o}</option>)}</select>);
  return (
    <Modal title="Meeting Settings" onClose={closeModal} width="max-w-[440px]">
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between rounded-md border border-good/40 bg-good/10 px-3 py-2.5"><span className="font-medium">Get unlimited transcripts <span className="ml-1 rounded bg-sky-500/20 px-1 text-[9px] font-bold text-sky-400">FREE</span></span><Toggle on={s.unlimited} onClick={() => set('unlimited', !s.unlimited)} label="Unlimited transcripts" /></div>
        <div><div className="flex items-center justify-between"><span className="font-medium">Auto-join calendar meetings</span><Toggle on={s.autoJoin} onClick={() => set('autoJoin', !s.autoJoin)} label="Auto-join" /></div>
          <Sel label="Calendar meetings to join" value={s.calendar} onChange={v => set('calendar', v)} opts={['All meetings with web-conf link', 'Only meetings I own', 'Only external meetings']} /></div>
        <div><span className="font-medium">Send email recap to</span><Sel label="Recap recipients" value={s.recap} onChange={v => set('recap', v)} opts={['Everyone on the invite', 'Only me', 'Nobody']} /></div>
        <div><span className="font-medium">Meeting privacy</span><Sel label="Privacy" value={s.privacy} onChange={v => set('privacy', v)} opts={['Teammates & Anyone with Link', 'Teammates only', 'Only me']} /></div>
        <div><span className="font-medium">Meeting language</span><Sel label="Language" value={s.language} onChange={v => set('language', v)} opts={LANGS} /></div>
        <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={closeModal}>Cancel</button><button className="btn-primary" onClick={save}>Save</button></div>
      </div>
    </Modal>
  );
}
