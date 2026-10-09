'use client';
import { useRef, useState } from 'react';
import { BookOpen, HelpCircle, Keyboard, MessageCircle } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { useClickOutside } from '@/lib/hooks';

export default function HelpButton() {
  const [open, setOpen] = useState(false);
  const [keys, setKeys] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { comingSoon } = useApp();
  useClickOutside(ref, () => { setOpen(false); setKeys(false); }, open);
  return (
    <div ref={ref} className="fixed bottom-4 right-4 z-40">
      {open && (
        <div className="menu absolute bottom-12 right-0 w-60 p-1.5">
          {keys ? (
            <div className="space-y-2 p-2.5 text-[12px]">
              <p className="font-semibold">Keyboard shortcuts</p>
              <p className="flex justify-between"><span>Search</span><kbd className="text-mute">Ctrl / ⌘ + K</kbd></p>
              <p className="flex justify-between"><span>Close dialogs</span><kbd className="text-mute">Esc</kbd></p>
              <p className="flex justify-between"><span>Play / pause</span><kbd className="text-mute">Space</kbd></p>
              <p className="flex justify-between"><span>Seek ±5s</span><kbd className="text-mute">← →</kbd></p>
            </div>
          ) : (<>
            <button className="menu-item" onClick={() => setKeys(true)}><Keyboard className="h-3.5 w-3.5 text-mute" />Keyboard shortcuts</button>
            <button className="menu-item" onClick={() => { setOpen(false); comingSoon('The help center'); }}><BookOpen className="h-3.5 w-3.5 text-mute" />Help center</button>
            <button className="menu-item" onClick={() => { setOpen(false); comingSoon('Live chat support'); }}><MessageCircle className="h-3.5 w-3.5 text-mute" />Chat with us</button>
          </>)}
        </div>)}
      <button onClick={() => { setOpen(o => !o); setKeys(false); }} aria-label="Help" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c9c2ff] text-[#2b1f6b] shadow-pop hover:brightness-105"><HelpCircle className="h-5 w-5" /></button>
    </div>
  );
}
