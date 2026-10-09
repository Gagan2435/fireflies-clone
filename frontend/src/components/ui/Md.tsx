import { Fragment, ReactNode } from 'react';

const inline = (s: string): ReactNode[] =>
  s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((p, i) =>
    p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p.startsWith('*') && p.length > 2 ? <em key={i}>{p.slice(1, -1)}</em> : <Fragment key={i}>{p}</Fragment>);

/** Tiny markdown subset (bold, italic, bullets) for assistant replies. No raw HTML is ever injected. */
export default function Md({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => { if (bullets.length) { blocks.push(<ul key={blocks.length} className="my-1 list-disc space-y-1 pl-4">{bullets.map((b, i) => <li key={i}>{inline(b)}</li>)}</ul>); bullets = []; } };
  text.split('\n').forEach(line => {
    const m = line.match(/^\s*[-•]\s+(.*)/);
    if (m) bullets.push(m[1]);
    else { flush(); if (line.trim()) blocks.push(<p key={blocks.length} className="my-1">{inline(line)}</p>); }
  });
  flush();
  return <>{blocks}</>;
}
