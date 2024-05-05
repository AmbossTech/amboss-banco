'use client';

import { ThemeToggle } from '@/components/ThemeToggle';
import { useUserSuspenseQuery } from '@/graphql/queries/__generated__/user.generated';

export default function Home() {
  const { data, error } = useUserSuspenseQuery();

  console.log(data, error);

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-2 2xl:p-24">
      <div className="z-10 flex w-full max-w-5xl items-center justify-between font-mono text-sm">
        <p className="">Banco</p>
        <ThemeToggle />
      </div>
      <div className="flex w-full max-w-5xl items-center justify-center py-10 2xl:py-40">
        LOGGED IN
      </div>
    </main>
  );
}
