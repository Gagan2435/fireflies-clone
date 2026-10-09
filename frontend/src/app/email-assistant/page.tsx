import { Mail } from 'lucide-react';
import ComingSoon from '@/components/ui/ComingSoon';

export default function Page() {
  return <ComingSoon title="Email Assistant" description="The Email Assistant that drafts replies and follow-ups from your meetings is not part of this demo." icon={<Mail className="h-5 w-5" />} />;
}
