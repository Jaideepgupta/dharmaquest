import type { Metadata, Viewport } from 'next';
import { Sparkles } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import AuthSync from '@/components/AuthSync';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dharmaquest-app.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'DharmaQuest — Explore the wisdom', template: '%s · DharmaQuest' },
  description: 'Explore the scriptures, philosophies and timeless wisdom of Sanatan Dharma through an engaging learning experience.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg' },
  openGraph: {
    type: 'website',
    siteName: 'DharmaQuest',
    title: 'DharmaQuest — Explore the wisdom',
    description: 'A modern learning journey through Sanatan Dharma, scriptures and Indian philosophy.',
    url: siteUrl,
  },
  twitter: { card: 'summary', title: 'DharmaQuest', description: 'A modern learning journey through Sanatan Dharma.' },
};

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#f7f4ec' }, { media: '(prefers-color-scheme: dark)', color: '#151613' }],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
};

/** Runs before first paint so a saved choice never flashes the wrong theme. Must stay tiny and dependency-free. */
const themeInit = `try{var t=localStorage.getItem('dq-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInit }} /></head>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <div className="announcement"><Sparkles size={14} aria-hidden="true" /> A new way to explore timeless wisdom <span className="announcement-dot" aria-hidden="true">✦</span> Start with one lesson a day</div>
        <AuthSync />
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
