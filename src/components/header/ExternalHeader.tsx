'use client';

import { ThemeToggle } from '../ThemeToggle';

export const ExternalHeader = () => {
  return (
    <div className="mt-1 flex w-full max-w-5xl items-center justify-between text-sm">
      <p className="text-lg font-bold">Banco</p>
      <ThemeToggle />
    </div>
  );
};
