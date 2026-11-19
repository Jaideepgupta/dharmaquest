'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Menu, Search, X } from 'lucide-react';
import SearchDialog from './SearchDialog';

const links = [
  { href: '/scriptures', label: 'Scriptures' },
  { href: '/gita', label: 'Gita Library' },
  { href: '/darshanas', label: 'Darshanas' },
  { href: '/learn', label: 'Learn' },
  { href: '/progress', label: 'My learning' },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="nav-wrap">
      <nav className="nav container" aria-label="Main">
        <Link className="brand" href="/" aria-label="DharmaQuest home">
          <span className="brand-mark" aria-hidden="true">ॐ</span>
          <span><strong>DharmaQuest</strong><small>WISDOM · WONDER · DISCOVERY</small></span>
        </Link>

        <div id="primary-nav" className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={pathname.startsWith(l.href) ? 'page' : undefined}>{l.label}</Link>
          ))}
          <button type="button" className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button>
        </div>

        <div className="nav-actions">
          <button type="button" className="icon-button search-top" aria-label="Search (Ctrl+K)" onClick={() => setSearchOpen(true)}><Search size={19} /></button>
          <Link className="button button-dark button-small" href="/learn">Start learning <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>

        <button type="button" className="mobile-search icon-button" aria-label="Search" onClick={() => setSearchOpen(true)}><Search size={20} /></button>
        <button type="button" className="mobile-menu" aria-label="Open menu" aria-expanded={menuOpen} aria-controls="primary-nav" onClick={() => setMenuOpen(true)}><Menu /></button>
      </nav>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
