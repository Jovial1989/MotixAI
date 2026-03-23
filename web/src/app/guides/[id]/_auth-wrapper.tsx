'use client';

import AuthGuard from '@/app/_auth-guard';

export default function AuthGuardWrapper({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
