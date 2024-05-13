'use client';

import Link from 'next/link';

import { useLogoutMutation } from '@/graphql/mutations/__generated__/logout.generated';
import { ROUTES } from '@/utils/routes';

import { VaultButton } from '../button/VaultButton';
import { ThemeToggle } from '../ThemeToggle';
import { Button } from '../ui/button';

export const InternalHeader = () => {
  const [logout] = useLogoutMutation({
    onCompleted: () => {
      window.location.href = ROUTES.home;
    },
    onError: err => console.log('ERROR', err),
  });

  return (
    <div className="mb-4 mt-1 flex w-full max-w-5xl items-center justify-between text-sm">
      <Link href={ROUTES.app.home}>
        <p className="text-lg font-bold">Banco</p>
      </Link>
      <div className="flex gap-2">
        <VaultButton />

        <Button variant="outline" onClick={() => logout()}>
          Logout
        </Button>

        <ThemeToggle />
      </div>
    </div>
  );
};
