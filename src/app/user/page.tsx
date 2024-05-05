'use client';

import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useLogoutMutation } from '@/graphql/mutations/__generated__/logout.generated';
import { useUserQuery } from '@/graphql/queries/__generated__/user.generated';

export default function Home() {
  const { data, loading, error } = useUserQuery();

  const [logout] = useLogoutMutation({
    onCompleted: () => {
      window.location.href = '/';
    },
    onError: error => {
      console.log(error);
    },
  });

  console.log(data, loading, error);

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-2 2xl:p-24">
      <div className="mt-1 flex w-full max-w-5xl items-center justify-between text-sm">
        <p className="text-lg font-bold">Banco</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => logout()}>
            Logout
          </Button>
          <ThemeToggle />
        </div>
      </div>
      <div className="flex w-full max-w-5xl items-center justify-center py-10 2xl:py-40">
        LOGGED IN
      </div>
    </main>
  );
}
