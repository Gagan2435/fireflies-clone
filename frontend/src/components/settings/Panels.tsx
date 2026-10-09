'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Globe, Lock, Monitor, Moon, Repeat2, Sun, Trash2, Type, UserCheck, UserX, Video, Bot, ListFilter, ShieldOff, Users, X, XCircle, MonitorPlay } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp, ThemePref } from '@/lib/app-context';
import { useSettings } from '@/lib/settings';
import { cx } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import { ProBadge, Row, Section, Select, Toggle } from './Controls';

const LANGS = ['English (Global)', 'English (US)', 'English (UK)', 'Hindi', 'Spanish', 'French', 'German', 'Portuguese', 'Japanese'];

export function AppearancePanel() {
  const { theme, setTheme } = useApp();
  const opts: { k: ThemePref; label: string; icon: typeof Sun }[] = [{ k: 'light', label: 'Light', icon: Sun }, { k: 'dark', label: 'Dark', icon: Moon }, { k: 'system', label: 'System', icon: Monitor }];
  return (
    <Section title="Language & Appearance">
      <Row icon={<Moon className="h-4 w-4" />} title="Theme" badge={<span className="rounded bg-accent/20 px-1 text-[9px] font-semibold text-accent">BETA</span>} desc="Choose how the application looks. Select System to automatically match your device settings.">
        <div className="flex gap-2" role="radiogroup" aria-label="Theme">
          {opts.map(o => (
            <button key={o.k} role="radio" aria-checked={theme === o.k} onClick={() => setTheme(o.k)}
              className={cx('flex h-16 w-[72px] flex-col items-center justify-center gap-1.5 rounded-lg border text-[12px]', theme === o.k ? 'border-accent bg-accent/10' : 'border-line hover:bg-hover')}>
              <o.icon className="h-4 w-4 text-mute" />{o.label}
            </button>))}
        </div>
      </Row>
    </Section>
  );
}

export function RecordingPanel() {
  const [s, set] = useSettings();
  const { comingSoon } = useApp();
  const pro = <ProBadge />;
  return (
    <>
      <p className="mt-6 rounded-md border border-line bg-hover/40 px-3 py-2 text-[12px] text-mute">These preferences are saved in this browser. There is no live bot in this demo, so they do not start any recording.</p>
      <Section title="Recording">
        <Row icon={<Bot className="h-4 w-4" />} title="Auto-record meetings" desc="Fireflies notetaker will join and record your calendar events." control={<Toggle label="Auto-record meetings" checked={s.autoRecord} onChange={v => { set({ autoRecord: v }); toast.success('Saved'); }} />}>
          {s.autoRecord && <Select label="Which meetings" value={s.autoRecordScope} options={['Record all calendar events with a meeting link', 'Only meetings I host', 'Only external meetings']} onChange={v => { set({ autoRecordScope: v }); toast.success('Saved'); }} />}
        </Row>
        <Row icon={<Video className="h-4 w-4" />} title="Capture meeting video" badge={pro} desc="Capture your meeting screen and shared content as video." control={<Toggle label="Capture meeting video" checked={s.captureVideo} disabled onChange={() => undefined} />} />
        <Row icon={<Type className="h-4 w-4" />} title="Meeting language" desc="For transcripts and summaries.">
          <Select label="Meeting language" value={s.meetingLanguage} options={LANGS} onChange={v => { set({ meetingLanguage: v }); toast.success('Saved'); }} />
        </Row>
        <Row icon={<Trash2 className="h-4 w-4" />} title="Auto-delete meetings" badge={pro} desc="Automatically delete meetings after a set retention period." control={<Toggle label="Auto-delete meetings" checked={s.autoDelete} disabled onChange={() => undefined} />} />
      </Section>

      <Section title="Privacy & Access">
        <Row icon={<Lock className="h-4 w-4" />} title="Meeting privacy" desc="Defaults apply to all new meetings.">
          <Select label="Meeting privacy" value={s.meetingPrivacy} options={['Only me', 'Teammates', 'Teammates & anyone with link']} onChange={v => { set({ meetingPrivacy: v }); toast.success('Saved'); }} />
        </Row>
        <Row icon={<Globe className="h-4 w-4" />} title="Public meeting access" badge={pro} desc="Allow anyone to view public meetings without logging in." control={<Toggle label="Public meeting access" checked={s.publicAccess} disabled onChange={() => undefined} />} />
        <Row icon={<UserCheck className="h-4 w-4" />} title="Auto-request access" desc="Automatically request access to private meetings you attend." control={<Toggle label="Auto-request access" checked={s.autoRequestAccess} onChange={v => { set({ autoRequestAccess: v }); toast.success('Saved'); }} />} />
      </Section>

      <Section title="Email Notification">
        <Row icon={<ListFilter className="h-4 w-4" />} title="Meeting recap email" desc="Send a recap email to selected recipients after each meeting is processed.">
          <div className="space-y-2">
            <Select label="Recap recipients" value={s.recapRecipients} options={['Everyone on the invite', 'Only me', 'Nobody']} onChange={v => { set({ recapRecipients: v }); toast.success('Saved'); }} />
            <p className="text-[12px] text-mute">What to include</p>
            <Select label="Recap content" value={s.recapContent} options={['Overview', 'Overview and action items', 'Full notes']} onChange={v => { set({ recapContent: v }); toast.success('Saved'); }} />
          </div>
        </Row>
        <Row icon={<ListFilter className="h-4 w-4" />} title="Meeting-prep email" desc="Send a prep email 1 hour before each recurring meeting with context from past interactions.">
          <Select label="Prep email recipients" value={s.prepEmail} options={['Send to all participants', 'Send only to me', 'Do not send']} onChange={v => { set({ prepEmail: v }); toast.success('Saved'); }} />
        </Row>
      </Section>

      <Section title="Recording Rules">
        <Row icon={<Video className="h-4 w-4" />} title="Recording rules" desc="Notetaker will record meetings if the calendar meeting title has mentioned keywords or emails id or domains.">
          <button className="btn-ghost" onClick={() => comingSoon('Recording rules')}>+ Record Rules</button></Row>
        <Row icon={<ShieldOff className="h-4 w-4" />} title="Restriction rules" desc="Notetaker will not record meetings if the calendar meeting title has mentioned keywords or emails id or domains.">
          <button className="btn-ghost" onClick={() => comingSoon('Restriction rules')}>+ Restriction Rules</button></Row>
      </Section>

      <Section title="Notetaker Preference">
        <Row icon={<MonitorPlay className="h-4 w-4" />} title="Notetaker name" badge={pro} desc="Your Fireflies bot will join meetings using this name. Applies to all future meetings.">
          <input className="input" value={s.notetakerName} disabled aria-label="Notetaker name" />
        </Row>
      </Section>
    </>
  );
}

export function AccountPanel() {
  const { me, comingSoon } = useApp();
  const [leave, setLeave] = useState(false);
  const [del, setDel] = useState(false);
  const [reason, setReason] = useState('');
  const name = (me?.name ?? 'User').toUpperCase();
  return (
    <>
      <div className="card mt-6 flex items-center gap-3 p-4">
        <Users className="h-5 w-5 text-mute" />
        <div className="flex-1"><p className="text-[13px] font-medium">{name}&apos;s Team <span className="ml-1 rounded bg-accent/20 px-1 text-[10px] font-semibold text-accent">FREE</span></p><p className="text-[12px] text-mute">1 member</p></div>
        <Link href="/upgrade" className="btn-primary">Upgrade</Link>
      </div>
      <Section title="Accounts">
        <Row icon={<Repeat2 className="h-4 w-4" />} title="Leave team" desc="You're the team admin. After leaving the team, you'll be downgraded to the free plan."><button className="btn-ghost" onClick={() => setLeave(true)}>Leave Team</button></Row>
        <Row icon={<XCircle className="h-4 w-4" />} title="Delete Account" desc="Permanently delete all your data, including meetings, summaries, extensions, and analytics."><button className="btn-ghost" onClick={() => setDel(true)}>Delete My Account</button></Row>
      </Section>

      {leave && (
        <Modal hideHeader onClose={() => setLeave(false)} width="max-w-[420px]">
          <div className="p-8 text-center">
            <UserCheck className="mx-auto h-6 w-6 text-accent" />
            <h2 className="mt-3 text-[18px] font-semibold leading-snug">Please assign admin before leaving your team</h2>
            <p className="mt-2 text-mute">You are the admin of your team. To leave your team, please assign a new team admin.</p>
            <div className="mt-5 flex items-center gap-2 rounded-md border border-line p-2.5 text-left"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-hover text-[10px] font-bold">{name[0]}</span>{name} (Myself)</div>
            <button className="btn-primary mt-5" disabled>Continue</button>
            <p className="mt-2 text-[11px] text-mute">Teams are coming soon, so there is nobody else to assign.</p>
            <button className="btn-ghost mt-3" onClick={() => setLeave(false)}>Close</button>
          </div>
        </Modal>)}

      {del && (
        <Modal hideHeader onClose={() => setDel(false)} width="max-w-[720px]">
          <div className="grid md:grid-cols-[260px_1fr]">
            <div className="rounded-l-lg bg-hover/40 p-6">
              <p className="mb-3 text-[13px] font-semibold">Deleting account means… You&apos;ll lose access to</p>
              <ul className="space-y-2 text-[12px] text-mute">{['All your meetings transcript and recording', 'All Chats and comments', 'AI Super Summaries for all meetings', 'All soundbite playlists', 'All your integrations'].map(t => <li key={t} className="flex gap-2"><X className="h-3.5 w-3.5 shrink-0 text-red-400" />{t}</li>)}</ul>
            </div>
            <div className="flex flex-col p-6">
              <h2 className="text-[16px] font-semibold">Before you go, please help us improve</h2>
              <p className="mt-1 text-mute">Your feedback helps us make Fireflies more accessible and easy to use.</p>
              <select className="input mt-4" aria-label="What went wrong" value={reason} onChange={e => setReason(e.target.value)}>
                <option value="">What went wrong?</option>{['Too expensive', 'Missing features', 'Switching to another tool', 'Other'].map(o => <option key={o}>{o}</option>)}
              </select>
              <textarea className="input mt-3 h-24 resize-none" placeholder="Tell us more…" aria-label="Tell us more" />
              <div className="mt-auto flex justify-between pt-6">
                <button className="btn-outline" onClick={() => setDel(false)}>Don&apos;t Delete</button>
                <button className="btn-primary" disabled={!reason} onClick={() => { setDel(false); comingSoon('Account deletion'); }}>Continue</button>
              </div>
            </div>
          </div>
        </Modal>)}
    </>
  );
}

export function SoonPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-24 text-center">
      <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-medium text-accent">Coming soon</span>
      <h2 className="mt-3 text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-mute">{description}</p>
    </div>
  );
}
