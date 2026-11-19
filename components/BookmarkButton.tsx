'use client';

import { Bookmark } from 'lucide-react';
import { toggleBookmark, useLearning, type BookmarkKind } from '@/lib/learning/store';

export default function BookmarkButton({ id, kind, title, href, compact }: { id: string; kind: BookmarkKind; title: string; href: string; compact?: boolean }) {
  const { state, ready } = useLearning();
  const saved = ready && state.bookmarks.some((b) => b.id === id && b.kind === kind);
  return (
    <button
      type="button"
      className={`bm-btn ${saved ? 'saved' : ''} ${compact ? 'compact' : ''}`}
      aria-pressed={saved}
      aria-label={saved ? `Remove bookmark: ${title}` : `Bookmark: ${title}`}
      onClick={() => toggleBookmark({ id, kind, title, href })}
    >
      <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
      <span>{saved ? 'Saved' : 'Save'}</span>
    </button>
  );
}
