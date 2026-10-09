import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-card text-accent"><Compass className="h-5 w-5" /></div>
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="mt-2 text-mute">We could not find that page. It may have moved, or the meeting may have been deleted.</p>
        <div className="mt-5 flex justify-center gap-2"><Link href="/" className="btn-primary">Go home</Link><Link href="/meetings" className="btn-ghost">Meetings</Link></div>
      </div>
    </div>
  );
}
