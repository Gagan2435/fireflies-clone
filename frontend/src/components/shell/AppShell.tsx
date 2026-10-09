'use client';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from '@/lib/app-context';
import Banner from './Banner';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import HelpButton from './HelpButton';
import SearchModal from './SearchModal';
import { LiveModal, MeetingSettingsModal, RecordModal, ScheduleModal } from './CaptureModals';

function Modals() {
  const { modal } = useApp();
  switch (modal) {
    case 'search': return <SearchModal />;
    case 'live': return <LiveModal />;
    case 'schedule': return <ScheduleModal />;
    case 'record': return <RecordModal />;
    case 'meetingSettings': return <MeetingSettingsModal />;
    default: return null;
  }
}

/** Settings has its own left nav (as in Fireflies), so the app sidebar and topbar step aside there. */
function Frame({ children }: { children: ReactNode }) {
  const standalone = usePathname().startsWith('/settings');
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Banner />
      <div className="flex min-h-0 flex-1">
        {!standalone && <Sidebar />}
        <div className="flex min-w-0 flex-1 flex-col">
          {!standalone && <Topbar />}
          <main className={standalone ? 'relative flex min-h-0 flex-1' : 'page-glow relative flex min-h-0 flex-1 flex-col overflow-y-auto'}>{children}</main>
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <Frame>{children}</Frame>
      <HelpButton />
      <Modals />
      <Toaster position="bottom-center" toastOptions={{ style: { background: 'rgb(var(--card))', color: 'rgb(var(--ink))', border: '1px solid rgb(var(--line))', fontSize: '13px' } }} />
    </AppProvider>
  );
}
