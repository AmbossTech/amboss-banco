'use client';

import { redirect } from 'next/navigation';

import { useUserQuery } from '@/graphql/queries/__generated__/user.generated';
import { ROUTES } from '@/utils/routes';

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data, loading, error } = useUserQuery();

  if (loading) {
    return null;
  }

  if (error || !data?.user.id) {
    redirect(ROUTES.login.home);
  }

  return <>{children}</>;
}
