'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import type { MeetingDetail } from '@/lib/types';

/** Participants are entered one per line as "Name" or "Name, email". */
export const parseParticipants = (s: string) => s.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
  const [name, email] = l.split(',').map(x => x.trim());
  return email ? { name, email } : { name };
});

export default function EditMeetingModal({ meeting, onClose, onSaved }: { meeting: MeetingDetail; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(meeting.title);
  const [people, setPeople] = useState(meeting.participants.map(p => (p.email ? `${p.name}, ${p.email}` : p.name)).join('\n'));
  const [tags, setTags] = useState(meeting.tags.map(t => t.name).join(', '));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!title.trim()) return toast.error('Title is required');
    setBusy(true);
    try {
      await api.updateMeeting(meeting.id, { title: title.trim(), participants: parseParticipants(people), tags: tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean) });
      toast.success('Meeting updated'); onSaved(); onClose();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save'); setBusy(false); }
  };
  return (
    <Modal title="Edit meeting" onClose={onClose} width="max-w-[480px]">
      <div className="space-y-4 p-5">
        <label className="block font-medium">Title<input className="input mt-1.5 font-normal" value={title} onChange={e => setTitle(e.target.value)} autoFocus /></label>
        <label className="block font-medium">Participants <span className="font-normal text-mute">(one per line: Name, email)</span>
          <textarea className="input mt-1.5 h-28 font-normal" value={people} onChange={e => setPeople(e.target.value)} /></label>
        <label className="block font-medium">Tags <span className="font-normal text-mute">(comma separated)</span>
          <input className="input mt-1.5 font-normal" value={tags} onChange={e => setTags(e.target.value)} /></label>
        <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>
      </div>
    </Modal>
  );
}
