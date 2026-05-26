import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/Toaster';

export const metadata: Metadata = {
  title: 'Saffron Lantern Almanac — holiday campaign factory',
  description: 'Pick a holiday, get a 30-day plan: 10 posts + 10 stories + 3 reels + offers, ready to ship.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('sla-theme');
            if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
          } catch (e) {}
        `}} />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
