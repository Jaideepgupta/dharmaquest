'use client';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="page-hero"><div className="container state-page">
      <div className="section-kicker">SOMETHING WENT WRONG</div>
      <h1 className="page-title">This page didn’t load.</h1>
      <p className="page-lede">Please try again. If it keeps happening, return to the homepage.</p>
      <div className="hero-buttons"><button type="button" className="button button-primary" onClick={reset}>Try again</button></div>
    </div></section>
  );
}
