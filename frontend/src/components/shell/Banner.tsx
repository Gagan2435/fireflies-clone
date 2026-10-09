'use client';
import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';
import { useStoredState } from '@/lib/hooks';

export default function Banner() {
  const [state, setState] = useStoredState<'show' | 'hidden'>('promo-banner', 'show');
  if (state === 'hidden') return null;
  return (
    <div className="relative flex shrink-0 items-center justify-center gap-2 bg-banner px-10 py-2 text-[12px]">
      <span>You are eligible for 7 days business plan free trial.</span>
      <Link href="/upgrade" className="inline-flex items-center gap-1 font-medium text-accent hover:underline">Start free trial <ArrowRight className="h-3 w-3" /></Link>
      <button onClick={() => setState('hidden')} aria-label="Dismiss" className="absolute right-3 rounded p-1 text-mute hover:text-ink"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}
