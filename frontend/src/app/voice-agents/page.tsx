import { Headphones } from 'lucide-react';
import ComingSoon from '@/components/ui/ComingSoon';

export default function Page() {
  return <ComingSoon title="Voice Agents" description="Voice agents that attend calls and ask the right questions on your behalf need live audio, which is out of scope for this demo." icon={<Headphones className="h-5 w-5" />} />;
}
