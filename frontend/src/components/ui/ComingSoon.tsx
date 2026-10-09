import Link from 'next/link';
import { Hammer } from 'lucide-react';
import { ReactNode } from 'react';

/** Standard placeholder for features the assignment lists as out of scope. */
export default function ComingSoon({ title, description, icon }: { title: string; description: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-card text-accent">{icon ?? <Hammer className="h-5 w-5" />}</div>
        <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-medium text-accent">Coming soon</span>
        <h1 className="mt-3 text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-mute">{description}</p>
        <Link href="/meetings" className="btn-primary mt-5">Go to Meetings</Link>
      </div>
    </div>
  );
}
