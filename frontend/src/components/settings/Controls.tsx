'use client';
import { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from '@/lib/utils';

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-2 flex items-center justify-between"><h2 className="text-[12px] font-medium text-mute">{title}</h2>{action}</div>
      <div className="card divide-y divide-line">{children}</div>
    </section>
  );
}

export function Row({ icon, title, desc, badge, control, children }: { icon?: ReactNode; title: string; desc?: string; badge?: ReactNode; control?: ReactNode; children?: ReactNode }) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        {icon && <span className="mt-0.5 text-mute">{icon}</span>}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[13px] font-medium">{title}{badge}</p>
          {desc && <p className="mt-0.5 text-[12px] text-mute">{desc}</p>}
        </div>
        {control}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
      className={cx('relative h-[18px] w-8 shrink-0 rounded-full transition-colors disabled:opacity-50', checked ? 'bg-accent' : 'bg-hover')}>
      <span className={cx('absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-all', checked ? 'left-[16px]' : 'left-0.5')} />
    </button>
  );
}

export function Select({ value, options, onChange, label }: { value: string; options: string[]; onChange: (v: string) => void; label: string }) {
  return (
    <div className="relative">
      <select aria-label={label} value={value} onChange={e => onChange(e.target.value)} className="input appearance-none pr-8">
        {[...new Set([value, ...options])].map(o => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mute" />
    </div>
  );
}

export const ProBadge = () => <span className="rounded bg-accent/20 px-1 text-[9px] font-semibold text-accent">PRO</span>;
