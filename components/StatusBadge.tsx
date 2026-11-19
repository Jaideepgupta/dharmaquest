import type { ContentStatus } from '@/lib/content/types';

export default function StatusBadge({ status }: { status: ContentStatus }) {
  return status === 'published'
    ? <span className="badge badge-ok">Published</span>
    : <span className="badge badge-review">Content under review</span>;
}
