import type { MetadataRoute } from 'next';
import { scriptureCategories } from '@/lib/content/scriptures';
import { darshanas } from '@/lib/content/darshanas';

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dharmaquest-app.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['', '/scriptures', '/darshanas', '/learn', '/about'];
  const scriptures = scriptureCategories.filter((c) => c.slug !== 'darshanas').map((c) => `/scriptures/${c.slug}`);
  const ds = darshanas.map((d) => `/darshanas/${d.slug}`);
  return [...staticRoutes, ...scriptures, ...ds].map((p) => ({ url: `${base}${p}` }));
}
