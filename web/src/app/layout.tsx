import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import LocaleProvider from './_locale-provider';
import LocaleGate from './_locale-gate';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Motixi — AI Repair Intelligence',
  description: 'Generate workshop-grade repair guides for vehicles and heavy machinery in seconds.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <LocaleProvider>
          <LocaleGate>
            {children}
          </LocaleGate>
        </LocaleProvider>
      </body>
    </html>
  );
}
