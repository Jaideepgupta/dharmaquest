'use client';

import { useEffect } from 'react';
import { recordView } from '@/lib/learning/store';

/** Renders nothing. Records that this page was viewed, in this browser only. */
export default function RecentTracker({ href, title, kind }: { href: string; title: string; kind: string }) {
  useEffect(() => { recordView({ href, title, kind }); }, [href, title, kind]);
  return null;
}
