import type { MetadataRoute } from 'next';
import { scriptureCategories } from '@/lib/content/scriptures';
import { darshanas } from '@/lib/content/darshanas';
import { bhagavadGitaChapters, gitaTexts, verseStudies } from '@/lib/content/gita';

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dharmaquest-app.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['', '/scriptures', '/gita', '/gita/bhagavad-gita', '/darshanas', '/darshanas/compare', '/learn', '/about'];
  const dedicated = ['darshanas', 'bhagavad-gita', 'other-gitas'];
  const scriptures = scriptureCategories.filter((c) => !dedicated.includes(c.slug)).map((c) => `/scriptures/${c.slug}`);
  const ds = darshanas.map((d) => `/darshanas/${d.slug}`);
  const gitas = gitaTexts.filter((g) => g.slug !== 'bhagavad-gita').map((g) => `/gita/${g.slug}`);
  const chapters = bhagavadGitaChapters.map((c) => `/gita/bhagavad-gita/${c.number}`);
  const verses = verseStudies.map((v) => `/gita/bhagavad-gita/${v.chapter}/${v.verse}`);
  return [...staticRoutes, ...scriptures, ...ds, ...gitas, ...chapters, ...verses].map((p) => ({ url: `${base}${p}` }));
}
