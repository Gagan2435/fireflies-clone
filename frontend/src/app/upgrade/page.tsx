'use client';
import { useState } from 'react';
import { Check } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { cx } from '@/lib/utils';

const PLANS = [
  { id: 'Free', blurb: 'For individuals starting with Fireflies', annual: 0, perks: ['Unlimited transcription*', 'Limited AI summaries', '400 minutes of storage/team'] },
  { id: 'Pro', blurb: 'Best suited for individuals and small teams', annual: 10, perks: ['Unlimited transcription', 'Unlimited AI summaries', '8,000 mins of storage/seat'] },
  { id: 'Business', blurb: 'Manage your fast growing team or business', annual: 19, popular: true, perks: ['Unlimited transcription', 'Unlimited AI summaries', 'Unlimited storage'] },
  { id: 'Enterprise', blurb: 'Advanced security, control & support', annual: 39, perks: ['Unlimited transcription', 'Unlimited AI summaries', 'Unlimited storage'] },
];

export default function UpgradePage() {
  const { me, comingSoon } = useApp();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');
  const current = me?.plan ?? 'Free';
  const price = (annual: number) => (billing === 'annual' ? annual : Math.round(annual / 0.6));
  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-center text-[26px] font-semibold">You are on the <span className="text-accent">{current}</span> plan</h1>
      <p className="mt-2 text-center text-mute">Compare plans and upgrade when you are ready.</p>
      <div className="mx-auto mt-6 flex w-fit rounded-full bg-hover/60 p-1 text-[12px]" role="radiogroup" aria-label="Billing period">
        <button role="radio" aria-checked={billing === 'monthly'} onClick={() => setBilling('monthly')} className={cx('rounded-full px-6 py-1.5', billing === 'monthly' ? 'bg-card font-medium shadow-sm' : 'text-mute')}>Monthly</button>
        <button role="radio" aria-checked={billing === 'annual'} onClick={() => setBilling('annual')} className={cx('flex items-center gap-2 rounded-full px-6 py-1.5', billing === 'annual' ? 'bg-card font-medium shadow-sm' : 'text-mute')}>Annual <span className="rounded bg-good/20 px-1 text-[10px] font-semibold text-good">40% OFF</span></button>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map(p => {
          const here = p.id === current;
          return (
            <section key={p.id} aria-label={`${p.id} plan`} className={cx('flex flex-col rounded-xl border bg-card p-5', p.popular ? 'border-accent' : 'border-line')}>
              <h2 className="flex items-center gap-2 text-[16px] font-semibold text-accent">{p.id}{here && <Check className="h-4 w-4" aria-label="Current plan" />}{p.popular && <span className="ml-auto rounded bg-accent/20 px-1.5 text-[9px] font-semibold">MOST POPULAR</span>}</h2>
              <p className="mt-1 min-h-[32px] text-[12px] text-mute">{p.blurb}</p>
              <p className="mt-4 text-[26px] font-semibold">${price(p.annual)}</p>
              <p className="text-[12px] text-mute">{p.annual === 0 ? 'Free forever' : `Per seat/month billed ${billing === 'annual' ? 'annually' : 'monthly'}`}</p>
              <ul className="mt-4 flex-1 space-y-2 text-[12px]">{p.perks.map(k => <li key={k} className="flex gap-2"><Check className="mt-0.5 h-3 w-3 shrink-0 text-mute" />{k}</li>)}</ul>
              <button disabled={here} onClick={() => comingSoon('Billing')} className={cx('mt-5 w-full', here ? 'btn-ghost' : 'btn-primary')}>{here ? 'Current' : 'Upgrade'}</button>
            </section>);
        })}
      </div>
      <p className="mt-6 text-center text-[12px] text-mute">Demo pricing only. Payments are not enabled, and monthly prices are derived from the annual discount.</p>
    </div>
  );
}
