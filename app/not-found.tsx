import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="page-hero"><div className="container state-page">
      <div className="section-kicker">PAGE NOT FOUND</div>
      <h1 className="page-title">We couldn’t find that page.</h1>
      <p className="page-lede">It may have moved, or may not exist yet. Try the library or search instead.</p>
      <div className="hero-buttons"><Link href="/scriptures" className="button button-primary">Browse scriptures</Link><Link href="/" className="button button-outline">Go home</Link></div>
    </div></section>
  );
}
