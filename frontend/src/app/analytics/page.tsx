import { BarChart3 } from 'lucide-react';
import ComingSoon from '@/components/ui/ComingSoon';

export default function Page() {
  return <ComingSoon title="Deal Intelligence & Team Analytics" description="Talk-time, topic trends and team analytics across your meetings will live here." icon={<BarChart3 className="h-5 w-5" />} />;
}
