import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import ProgressDashboard from '@/components/ProgressDashboard';
import { lessonMeta } from '@/lib/learning/lessons';

export const metadata: Metadata = {
  title: 'My learning',
  description: 'Your lessons, quiz results, bookmarks and study streak, stored privately in your browser.',
  robots: { index: false },
};

export default function ProgressPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'My learning' }]} kicker="YOUR PLACE IN THE LIBRARY" title="My learning"
        lede="Lessons you have completed, quiz results, bookmarks and what you opened recently. It is all kept privately in this browser, with no account." />
      <section className="section tight"><div className="container"><ProgressDashboard meta={lessonMeta} /></div></section>
    </>
  );
}
