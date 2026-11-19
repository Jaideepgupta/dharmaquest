import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import AccountPanel from '@/components/AccountPanel';

export const metadata: Metadata = {
  title: 'Account',
  description: 'Sign in with an email link to keep your progress across devices.',
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Account' }]} kicker="OPTIONAL" title="Account"
        lede="Sign in to keep your lessons, quiz results and bookmarks across devices. You never need an account to use DharmaQuest." />
      <section className="section tight"><div className="container"><AccountPanel /></div></section>
    </>
  );
}
