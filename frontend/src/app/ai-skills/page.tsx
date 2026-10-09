import { Sparkles } from 'lucide-react';
import ComingSoon from '@/components/ui/ComingSoon';

export default function Page() {
  return <ComingSoon title="AI Skills" description="Enable ready-made skills that pull specific insights out of your meetings, such as daily briefs and follow-ups." icon={<Sparkles className="h-5 w-5" />} />;
}
