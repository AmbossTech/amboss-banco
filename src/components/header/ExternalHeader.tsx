'use client';

import Link from 'next/link';

import { useUserQuery } from '@/graphql/queries/__generated__/user.generated';
import { ROUTES } from '@/utils/routes';

import { LanguageToggle } from '../toggle/LanguageToggle';
import { ThemeToggle } from '../toggle/ThemeToggle';
import { Button } from '../ui/button';

export const ExternalHeader = () => {
  const { data, loading } = useUserQuery();

  return (
    <div className="mt-1 flex w-full max-w-5xl flex-wrap items-center justify-between text-sm">
      <Link href={ROUTES.home}>
        <p className="text-xl font-bold">MiBanco</p>
      </Link>
      <div className="flex items-center justify-center gap-2">
        {loading ? null : data?.user.id ? (
          <Button asChild>
            <Link href={ROUTES.dashboard}>Go to App</Link>
          </Button>
        ) : (
          <>
            <Button variant="ghost" asChild>
              <Link href={ROUTES.login}>Login</Link>
            </Button>
            <Button asChild>
              <Link href={ROUTES.signup}>Sign Up</Link>
            </Button>
          </>
        )}
        <ThemeToggle />
        <LanguageToggle />
      </div>
    </div>
  );
};
