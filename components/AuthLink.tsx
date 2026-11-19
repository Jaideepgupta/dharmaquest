'use client';

import Link from 'next/link';
import { User } from 'lucide-react';
import { publicConfig } from '@/lib/supabase/public-config';
import { useAccountStatus } from '@/lib/auth/status';

/** Header link to the Account page. Absent entirely when accounts are not configured. */
export default function AuthLink() {
  const enabled = publicConfig().enabled;
  const { status } = useAccountStatus();
  if (!enabled) return null;
  return (
    <Link href="/account" className="auth-link" aria-label={status.userId ? 'Your account' : 'Sign in'}>
      <User size={16} aria-hidden="true" /> <span>{status.userId ? 'Account' : 'Sign in'}</span>
    </Link>
  );
}
