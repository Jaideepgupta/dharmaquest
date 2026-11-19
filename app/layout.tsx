import type { Metadata, Viewport } from 'next';
import { Sparkles } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
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

export const viewport: Viewport = { themeColor: '#f7f4ec', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <div className="announcement"><Sparkles size={14} aria-hidden="true" /> A new way to explore timeless wisdom <span className="announcement-dot" aria-hidden="true">✦</span> Start with one lesson a day</div>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
