import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/shell/AppShell';

export const metadata: Metadata = {
  title: 'Fireflies.ai: AI meeting notes',
  description: 'Fireflies.ai clone: meeting library, interactive transcripts, AI summaries and action items.',
};

// Set the theme class before first paint so there is no dark/light flash.
const themeScript = `try{var t=localStorage.getItem('theme')||'dark';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.add(d?'dark':'light')}catch(e){document.documentElement.classList.add('dark')}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
