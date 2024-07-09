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
    <main className="flex min-h-screen flex-col items-center justify-start p-2">
      <ExternalHeader />
      <div className="flex w-full max-w-5xl items-center justify-center py-10">
        {children}
      </div>
    </main>
  );
}
