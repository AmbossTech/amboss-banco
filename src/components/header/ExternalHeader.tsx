import { X } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/utils/routes';

import { Logo } from '../Logo';

export const ExternalHeader = () => {
  return (
    <header className="flex w-full items-center justify-between space-x-2 border-b border-neutral-800 p-4 lg:px-12 lg:py-2">
      <Logo className="w-40 fill-foreground lg:w-44" />

      <Link href={ROUTES.home} className="transition-opacity hover:opacity-75">
        <X size={24} />
      </Link>
    </header>
  );
};
