import { colorFor, getInitials } from '@/lib/utils';

export default function Avatar({ name, size = 24 }: { name: string; size?: number }) {
  return (
    <span title={name} className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-card"
      style={{ width: size, height: size, background: colorFor(name), fontSize: size * 0.4 }}>{getInitials(name)}</span>
  );
}
