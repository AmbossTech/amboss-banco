'use client';

import { redirect } from 'next/navigation';

import { ExternalHeader } from '@/components/header/ExternalHeader';
import { useUserQuery } from '@/graphql/queries/__generated__/user.generated';
import { ROUTES } from '@/utils/routes';

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data, loading } = useUserQuery();

  if (loading) {
    return null;
  }

  if (data?.user.id) {
    redirect(ROUTES.dashboard);
  }

  return (
    <main>
      <ExternalHeader />
      {children}
    </main>
  );
}
