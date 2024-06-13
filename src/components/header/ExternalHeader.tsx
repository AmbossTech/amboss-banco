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
        <Link href={ROUTES.signup}>
          <Button variant="outline">Sign Up</Button>
        </Link>
        <ThemeToggle />
      </div>
    </div>
  );
};
