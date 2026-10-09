import { escapeRegExp } from '@/lib/utils';

/** Highlights every match of q in text. The query is regex-escaped, so "(" or "?" cannot crash it. */
export default function Highlight({ text, q }: { text: string; q: string }) {
  const needle = q.trim();
  if (!needle) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(needle)})`, 'ig'));
  return <>{parts.map((p, i) => p.toLowerCase() === needle.toLowerCase()
    ? <mark key={i} className="rounded bg-accent/30 px-0.5 text-ink">{p}</mark> : <span key={i}>{p}</span>)}</>;
}
