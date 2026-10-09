'use client';
import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cx } from '@/lib/utils';

export default function Modal({ title, onClose, children, width = 'max-w-[440px]', hideHeader = false, align = 'center' }: {
  title?: string; onClose: () => void; children: ReactNode; width?: string; hideHeader?: boolean; align?: 'center' | 'top';
}) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', key);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className={cx('fixed inset-0 z-[100] flex justify-center bg-black/60 p-4 backdrop-blur-[1px]', align === 'top' ? 'items-start pt-[12vh]' : 'items-center')}
         onMouseDown={e => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={title}>
      <div className={cx('card w-full shadow-pop', width)}>
        {!hideHeader && (
          <div className="flex items-center justify-between px-5 pt-4">
            <h2 className="text-[14px] font-semibold">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="rounded p-1 text-mute hover:bg-hover hover:text-ink"><X className="h-4 w-4" /></button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
