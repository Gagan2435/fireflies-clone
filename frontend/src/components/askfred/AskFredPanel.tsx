'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUp, Bot, Sparkles, Trash2 } from 'lucide-react';
import { useChat } from '@/lib/useChat';
import { useApp } from '@/lib/app-context';
import { cx } from '@/lib/utils';
import Md from '@/components/ui/Md';

interface Props {
  meetingId?: number;
  scope: string;               // label shown in the composer chip, e.g. "My Meetings"
  heading?: string;
  suggestions?: string[];
  initialQuestion?: string;
  className?: string;
}

export default function AskFredPanel({ meetingId, scope, heading, suggestions = [], initialQuestion, className }: Props) {
  const { me } = useApp();
  const { msgs, busy, send, clear } = useChat(meetingId, initialQuestion);
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs, busy]);
  const submit = (q: string) => { if (q.trim() && !busy) { setText(''); send(q); } };

  return (
    <section className={cx('flex min-h-0 flex-col bg-panel', className)} aria-label="Ask Fred">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <Bot className="h-4 w-4 text-accent" /><span className="flex-1 text-[13px] font-medium">Ask Fred</span>
        {msgs.length > 0 && <button onClick={clear} aria-label="Clear chat" title="Clear chat" className="rounded p-1 text-mute hover:bg-hover hover:text-ink"><Trash2 className="h-3.5 w-3.5" /></button>}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {msgs.length === 0 && (
          <div>
            <Sparkles className="h-5 w-5 text-accent" />
            <p className="mt-3 text-[16px] font-semibold leading-snug">Hi {me?.name ?? 'there'}!<br />{heading ?? 'Get ready for your meeting'}</p>
            <div className="mt-4 space-y-1.5">
              {suggestions.map(s => <button key={s} onClick={() => submit(s)} className="block w-full rounded-md border border-line bg-card px-3 py-2 text-left text-[12px] hover:bg-hover">{s}</button>)}
            </div>
          </div>
        )}
        {msgs.map(m => m.role === 'user' ? (
          <div key={m.id} className="flex justify-end"><p className="max-w-[85%] rounded-lg bg-accent/25 px-3 py-1.5">{m.content}</p></div>
        ) : (
          <div key={m.id} className="text-[13px] leading-relaxed"><Md text={m.content} />
            {m.sources.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1">{m.sources.map(s => <span key={s} className="rounded-full border border-line px-2 py-0.5 text-[11px] text-mute">{s}</span>)}</div>}
          </div>
        ))}
        {busy && <p className="animate-pulse text-mute">Understanding your request…</p>}
        <div ref={end} />
      </div>

      <form onSubmit={e => { e.preventDefault(); submit(text); }} className="m-3 rounded-lg border border-line bg-card p-2.5">
        <span className="mb-1.5 inline-flex rounded bg-hover px-1.5 py-0.5 text-[11px] text-mute"># {scope}</span>
        <div className="flex items-end gap-2">
          <textarea value={text} onChange={e => setText(e.target.value)} rows={1} placeholder="Ask anything about your meetings…" aria-label="Ask Fred"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(text); } }}
            className="max-h-24 min-h-[24px] flex-1 resize-none bg-transparent outline-none placeholder:text-mute" />
          <button type="submit" disabled={!text.trim() || busy} aria-label="Send" className="rounded-md bg-accent p-1.5 text-accent-ink disabled:opacity-40"><ArrowUp className="h-3.5 w-3.5" /></button>
        </div>
      </form>
      {meetingId === undefined && <p className="pb-2 text-center text-[11px] text-mute">Answers come from your meeting transcripts. <Link href="/askfred" className="text-accent hover:underline">Open full chat</Link></p>}
    </section>
  );
}
