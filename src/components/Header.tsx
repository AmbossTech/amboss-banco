'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useLogoutMutation } from '@/graphql/mutations/__generated__/logout.generated';
import { useUserQuery } from '@/graphql/queries/__generated__/user.generated';
import { ROUTES } from '@/utils/routes';

import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';

export const Header = () => {
  const pathname = usePathname();

  const { data } = useUserQuery({ errorPolicy: 'ignore' });

  const [logout] = useLogoutMutation({
    onCompleted: () => {
      window.location.href = ROUTES.home;
    },
    onError: error => {
      console.log(error);
    },
  });

  const isLoggedIn = !!data?.user.id;
  const isInternal = pathname.startsWith('/app');

  return (
    <div className="mt-1 flex w-full max-w-5xl items-center justify-between text-sm">
      <p className="text-lg font-bold">Banco</p>
      <div className="flex gap-2">
        {isLoggedIn ? (
          isInternal ? (
            <Button variant="outline" onClick={() => logout()}>
              Logout
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link href={ROUTES.app.home}>Go To App</Link>
            </Button>
          )
        ) : null}
        <ThemeToggle />
      </div>
    </div>
  );
};
