'use client';

import Image from 'next/image';
import Link from 'next/link';

import x from '/public/icons/x.svg';
import { elementScroll } from '@/utils/elementScroll';
import { ROUTES } from '@/utils/routes';

const links = ['about', 'features', 'community', 'security', 'support'];
const year = new Date().getFullYear();

export const Footer = () => {
  return (
    <footer className="w-full px-4 pb-20 pt-4 lg:px-14 lg:pb-16 lg:pt-6">
      <div className="mb-20 flex w-full flex-col justify-between gap-20 py-4 lg:mb-12 lg:flex-row lg:items-center lg:gap-4 lg:py-6">
        <Link href={ROUTES.home} className="text-2xl font-bold text-black">
          Banco
        </Link>

        <nav className="flex flex-col gap-10 text-lg font-semibold text-black lg:flex-row lg:items-center lg:gap-16 lg:text-base">
          {links.map(l =>
            l !== 'support' ? (
              <button
                key={l}
                className="w-fit capitalize"
                onClick={() => elementScroll('#' + l)}
              >
                {l}
              </button>
            ) : (
              <a
                key={l}
                href={ROUTES.external.support}
                className="w-fit capitalize"
              >
                {l}
              </a>
            )
          )}
        </nav>

        <a
          href={ROUTES.external.x}
          target="_blank"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-950 transition-colors hover:bg-neutral-950/90"
        >
          <Image src={x} alt="x" />
        </a>
      </div>

      <p className="text-center text-sm font-semibold text-black/65">
        Copyright © {year} Banco
      </p>
    </footer>
  );
};
