'use client';

import { useEffect } from 'react';
import { publicConfig } from '@/lib/supabase/public-config';

/**
 * Keeps this device in sync with the account, site-wide. Renders nothing.
 * When accounts are not configured it does nothing at all (the runtime is never even downloaded).
 * When they are, it only wakes up for visitors who already have a session cookie; everyone else is
 * untouched until they visit the Account page.
 */
export default function AuthSync() {
  useEffect(() => {
    if (!publicConfig().enabled) return;
    if (!/(?:^|;\s*)sb-[^=]*-auth-token/.test(document.cookie)) return;
    void import('@/lib/auth/runtime').then((m) => m.startAccountSync());
  }, []);
  return null;
}
