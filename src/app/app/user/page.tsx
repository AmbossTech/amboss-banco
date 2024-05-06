'use client';

import { InternalHeader } from '@/components/header/InternalHeader';
import { useUserQuery } from '@/graphql/queries/__generated__/user.generated';

export default function Page() {
  const { data } = useUserQuery({ errorPolicy: 'ignore' });

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-2 2xl:p-24">
      <InternalHeader />
      <div className="flex w-full max-w-5xl items-center justify-center py-10 2xl:py-40">
        {`User ID: ${data?.user.id || '-'}`}
      </div>
    </main>
  );
}
