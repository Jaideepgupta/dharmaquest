import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function PageHeader({
  crumbs, kicker, title, sanskrit, lede, children,
}: {
  crumbs: { label: string; href?: string }[];
  kicker?: string; title: string; sanskrit?: string; lede?: string; children?: React.ReactNode;
}) {
  return (
    <section className="page-hero">
      <div className="container">
        <nav aria-label="Breadcrumb" className="crumbs">
          <ol>
            <li><Link href="/">Home</Link></li>
            {crumbs.map((c) => (
              <li key={c.label}><ChevronRight size={13} aria-hidden="true" />{c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}</li>
            ))}
          </ol>
        </nav>
        {kicker && <div className="section-kicker">{kicker}</div>}
        <h1 className="page-title">{title}{sanskrit && <span className="page-sanskrit" lang="sa">{sanskrit}</span>}</h1>
        {lede && <p className="page-lede">{lede}</p>}
        {children}
      </div>
    </section>
  );
}
