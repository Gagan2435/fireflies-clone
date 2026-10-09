'use client';
import { DragEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useApp } from '@/lib/app-context';
import { cx } from '@/lib/utils';
import { parseParticipants } from '@/components/meeting/EditMeetingModal';

const TEXT_EXT = /\.(txt|vtt|srt|json)$/i;
const parseTags = (v: string) => v.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean).join(',');
const AUDIO_EXT = /\.(mp3|m4a|wav|mp4|webm)$/i;

export default function Uploads() {
  const router = useRouter();
  const { refresh, comingSoon } = useApp();
  const [mode, setMode] = useState<'file' | 'paste'>('file');
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [people, setPeople] = useState('');
  const [tags, setTags] = useState('');
  const [text, setText] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const done = (id: number) => { toast.success('Meeting created. Notes were generated from the transcript.'); refresh(); router.push(`/meetings/${id}`); };

  const uploadFile = async (f: File | undefined) => {
    if (!f) return;
    if (AUDIO_EXT.test(f.name)) return comingSoon('Audio/video transcription') ;
    if (!TEXT_EXT.test(f.name)) return toast.error('Unsupported file. Upload a .txt, .vtt, .srt or .json transcript.');
    setBusy(true);
    try { const m = await api.uploadTranscript(f, title.trim() || undefined, people.split('\n').map(l => l.split(',')[0].trim()).filter(Boolean).join(',') || undefined, parseTags(tags) || undefined); done(m.id); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Upload failed'); setBusy(false); }
  };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); uploadFile(e.dataTransfer.files[0]); };

  const create = async () => {
    if (!title.trim()) return toast.error('Give the meeting a title');
    if (!text.trim()) return toast.error('Paste a transcript first');
    setBusy(true);
    try {
      const m = await api.createMeeting({ title: title.trim(), transcript_text: text, participants: parseParticipants(people), tags: parseTags(tags).split(',').filter(Boolean), platform: 'upload' });
      done(m.id);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not create meeting'); setBusy(false); }
  };

  return (
    <div className="mx-auto w-full max-w-[720px] px-6 py-8">
      <div className="mb-4 flex rounded-md bg-hover/60 p-0.5 text-[12px]" role="tablist">
        {([['file', 'Upload a file'], ['paste', 'Paste transcript']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={mode === k} onClick={() => setMode(k)} className={cx('flex-1 rounded px-3 py-1.5', mode === k ? 'bg-card font-medium shadow-sm' : 'text-mute')}>{l}</button>))}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <label className="block font-medium">Meeting title <span className="font-normal text-mute">{mode === 'file' ? '(optional)' : ''}</span>
          <input className="input mt-1.5 font-normal" value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g. Weekly product sync" /></label>
        <label className="block font-medium">Tags <span className="font-normal text-mute">(comma separated)</span>
          <input className="input mt-1.5 font-normal" value={tags} onChange={e => setTags(e.target.value)} placeholder="product, roadmap" /></label>
        <label className="block font-medium sm:col-span-2">Participants <span className="font-normal text-mute">(one per line: Name, email)</span>
          <textarea className="input mt-1.5 h-16 font-normal" value={people} onChange={e => setPeople(e.target.value)} placeholder={'Alex Rivers, alex@acme.com\nMaya Chen'} /></label>
      </div>

      {mode === 'file' ? (
        <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop}
          className={cx('rounded-xl border border-dashed px-6 py-12 text-center transition-colors', drag ? 'border-accent bg-accent/10' : 'border-accent/50')}>
          <Upload className="mx-auto h-5 w-5 text-accent" />
          <p className="mt-3 text-[14px] font-semibold">Upload a transcript to generate meeting notes</p>
          <p className="mt-1.5 text-[12px] text-mute">Browse or drag and drop a .txt, .vtt, .srt or .json transcript. Speaker names and timestamps are optional.</p>
          <button className="btn-primary mt-5" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Processing…' : 'Browse Files'}</button>
          <input ref={input} type="file" accept=".txt,.vtt,.srt,.json,.mp3,.m4a,.wav,.mp4,.webm" hidden onChange={e => { uploadFile(e.target.files?.[0]); e.target.value = ''; }} />
          <p className="mt-4 text-[11px] text-mute">Audio and video files (MP3, M4A, WAV, MP4, WEBM) need speech-to-text, which is coming soon.</p>
        </div>
      ) : (
        <div>
          <label className="block font-medium"><span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Transcript</span>
            <textarea className="input mt-1.5 h-64 font-mono text-[12px] font-normal" value={text} onChange={e => setText(e.target.value)}
              placeholder={'Alex Rivers: Welcome everyone. Today we are going over the roadmap.\nMaya Chen: Thanks Alex. Liam, can you send the benchmark results by Friday?\n\nWebVTT, SRT and timestamped lines like [00:12] Alex: … work too.'} /></label>
          <div className="mt-3 flex justify-end"><button className="btn-primary" onClick={create} disabled={busy}>{busy ? 'Generating notes…' : 'Create meeting'}</button></div>
        </div>
      )}
    </div>
  );
}
