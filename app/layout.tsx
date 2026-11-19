import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'DharmaQuest — Explore the wisdom',
  description: 'A modern learning journey through Sanatan Dharma, scriptures and Indian philosophy.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg' }
};
export const viewport: Viewport = { themeColor: '#f7f4ec' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
