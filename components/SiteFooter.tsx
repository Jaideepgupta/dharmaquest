import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-main">
        <Link className="brand" href="/" aria-label="DharmaQuest home">
          <span className="brand-mark" aria-hidden="true">ॐ</span>
          <span><strong>DharmaQuest</strong><small>WISDOM · WONDER · DISCOVERY</small></span>
        </Link>
        <p>A modern learning space for timeless ideas.</p>
        <nav className="footer-links" aria-label="Footer">
          <Link href="/scriptures">Scriptures</Link>
          <Link href="/darshanas">Darshanas</Link>
          <Link href="/learn">Learn</Link>
          <Link href="/about">Our approach</Link>
        </nav>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 DharmaQuest · An independent learning concept</span>
        <span>Built for wonder, guided by sources.</span>
      </div>
    </footer>
  );
}
