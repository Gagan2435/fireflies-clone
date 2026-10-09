'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Bot, CalendarCheck, CheckSquare, FileText, Layers, ListChecks, MessageSquare, Plus, Search, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { useChat } from '@/lib/useChat';
import { cx } from '@/lib/utils';
import Md from '@/components/ui/Md';
import Modal from '@/components/ui/Modal';
import ConnectorsModal from '@/components/askfred/ConnectorsModal';

const SUGGESTIONS = [
  { text: 'List my action items & todos for this week', icon: CheckSquare },
  { text: 'Summarize my last meeting', icon: ListChecks },
  { text: 'Prepare me for the upcoming meeting', icon: Wand2 },
  { text: 'Prepare weekly digest, based on my meetings', icon: CalendarCheck },
];

function HistorySearch({ onClose, msgs }: { onClose: () => void; msgs: { id: number; role: string; content: string }[] }) {
  const [q, setQ] = useState('');
  const hits = useMemo(() => q.trim() ? msgs.filter(m => m.content.toLowerCase().includes(q.trim().toLowerCase())) : [], [q, msgs]);
  return (
    <Modal hideHeader align="top" onClose={onClose} width="max-w-[520px]">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3"><Search className="h-4 w-4 text-mute" />
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search Chat History" aria-label="Search chat history" className="flex-1 bg-transparent outline-none placeholder:text-mute" /></div>
      <div className="max-h-[320px] overflow-y-auto p-2">
        {msgs.length === 0 && <div className="py-14 text-center"><Search className="mx-auto h-4 w-4 text-mute" /><p className="mt-2 font-medium">No conversations yet</p><p className="text-mute">Start a new chat to see it appear here.</p></div>}
        {msgs.length > 0 && !q.trim() && <p className="py-10 text-center text-mute">Type to search your conversation</p>}
        {q.trim() && hits.length === 0 && msgs.length > 0 && <p className="py-10 text-center text-mute">No messages match “{q}”</p>}
        {hits.map(m => <div key={m.id} className="rounded-md px-3 py-2 hover:bg-hover"><p className="text-[11px] text-mute">{m.role === 'user' ? 'You' : 'Fred'}</p><p className="line-clamp-2">{m.content.replace(/[*_]/g, '')}</p></div>)}
      </div>
    </Modal>
  );
}

export default function AskFredPage() {
  const { me, openModal } = useApp();
  const { msgs, busy, send, clear } = useChat();
  const [text, setText] = useState('');
  const [searching, setSearching] = useState(false);
  const [connectors, setConnectors] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs, busy]);
  const submit = (q: string) => { if (q.trim() && !busy) { setText(''); send(q); } };
  const first = msgs.find(m => m.role === 'user');
  const name = me?.name ?? 'there';

  const composer = (
    <form onSubmit={e => { e.preventDefault(); submit(text); }} className="rounded-xl border border-line bg-card p-3 focus-within:border-accent">
      <textarea value={text} onChange={e => setText(e.target.value)} rows={2} aria-label="Ask Fred" placeholder="Ask anything, @ for context and / for skills"
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(text); } }} className="w-full resize-none bg-transparent outline-none placeholder:text-mute" />
      <div className="mt-1 flex items-center gap-1">
        <button type="button" onClick={() => openModal('record')} aria-label="Add" className="rounded p-1.5 text-mute hover:bg-hover"><Plus className="h-4 w-4" /></button>
        <button type="button" onClick={() => setConnectors(true)} aria-label="Connectors" className="rounded p-1.5 text-mute hover:bg-hover"><Layers className="h-4 w-4" /></button>
        <span className="ml-auto text-[12px] text-mute">Fred</span>
        <button type="submit" disabled={!text.trim() || busy} aria-label="Send" className="rounded-md bg-accent p-1.5 text-accent-ink disabled:opacity-40"><ArrowUp className="h-4 w-4" /></button>
      </div>
    </form>
  );

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="hidden w-[224px] shrink-0 flex-col border-r border-line bg-panel p-3 md:flex" aria-label="Chats">
        <button onClick={() => { if (msgs.length && window.confirm('Start a new chat? This clears the current conversation.')) clear(); }} className="menu-item"><Plus className="h-3.5 w-3.5" />New Chat</button>
        <button onClick={() => setSearching(true)} className="menu-item"><Search className="h-3.5 w-3.5" />Search</button>
        <button onClick={() => setConnectors(true)} className="menu-item"><Layers className="h-3.5 w-3.5" />Connectors</button>
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {first ? (
            <div className="group flex items-center gap-2 rounded-md bg-hover px-2.5 py-1.5"><MessageSquare className="h-3.5 w-3.5 shrink-0 text-mute" /><span className="min-w-0 flex-1 truncate text-[12px]">{first.content}</span>
              <button onClick={clear} aria-label="Delete chat" className="text-mute opacity-0 hover:text-ink group-hover:opacity-100 focus:opacity-100"><Trash2 className="h-3 w-3" /></button></div>
          ) : (
            <div className="px-2 pt-8 text-center"><p className="text-[12px] font-medium">No chats yet</p><p className="mt-1 text-[12px] text-mute">Your chats will appear here once you start one.</p></div>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {msgs.length === 0 ? (
          <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col justify-center px-6 pb-16">
            <h1 className="mb-5 text-[22px] font-semibold">Hi {name}, how can I help today?</h1>
            {composer}
            <div className="mt-3 space-y-1.5">
              {SUGGESTIONS.map(s => <button key={s.text} onClick={() => submit(s.text)} className="flex w-full items-center gap-3 rounded-md bg-card px-3 py-2.5 text-left hover:bg-hover"><s.icon className="h-3.5 w-3.5 text-mute" />{s.text}</button>)}
              <button onClick={() => setConnectors(true)} className="flex w-full items-center gap-3 rounded-md bg-card px-3 py-2.5 text-left hover:bg-hover"><Layers className="h-3.5 w-3.5 text-mute" />Connect Gmail, Notion, and 30+ sources for richer insights.</button>
            </div>
            <p className="mt-6 text-center text-[11px] text-mute">Answers come from your meeting transcripts</p>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-[680px] space-y-4 px-6 py-6">
                {msgs.map(m => m.role === 'user' ? (
                  <div key={m.id} className="flex justify-end"><p className="max-w-[80%] rounded-xl bg-accent/25 px-3.5 py-2">{m.content}</p></div>
                ) : (
                  <div key={m.id} className="flex gap-3"><Bot className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <div className="min-w-0 flex-1 text-[13px] leading-relaxed"><Md text={m.content} />
                      {m.sources.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{m.sources.map(s => <span key={s} className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[11px] text-mute"><FileText className="h-3 w-3" />{s}</span>)}</div>}
                    </div></div>
                ))}
                {busy && <p className={cx('flex items-center gap-2 text-mute', 'animate-pulse')}><Sparkles className="h-3.5 w-3.5 text-accent" />Understanding your request…</p>}
                <div ref={end} />
              </div>
            </div>
            <div className="mx-auto w-full max-w-[680px] px-6 pb-5">{composer}</div>
          </>
        )}
      </div>
      {searching && <HistorySearch onClose={() => setSearching(false)} msgs={msgs} />}
      {connectors && <ConnectorsModal onClose={() => setConnectors(false)} />}
    </div>
  );
}
