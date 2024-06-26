'use client';

import Link from 'next/link';

import { ROUTES } from '@/utils/routes';

import { ThemeToggle } from '../ThemeToggle';
import { Button } from '../ui/button';

export const ExternalHeader = () => {
  return (
    <div className="mt-1 flex w-full max-w-5xl items-center justify-between text-sm">
      <Link href={ROUTES.home}>
        <p className="text-xl font-bold">Banco</p>
      </Link>
      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" asChild>
          <Link href={ROUTES.login}>Login</Link>
        </Button>
        <Button asChild>
          <Link href={ROUTES.signup}>Sign Up</Link>
        </Button>
        <ThemeToggle />
      </div>
    </div>
  );
};
