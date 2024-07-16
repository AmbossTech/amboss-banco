'use client';

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useUserQuery } from '@/graphql/queries/__generated__/user.generated';
import { elementScroll } from '@/utils/elementScroll';
import { ROUTES } from '@/utils/routes';

const links = ['about', 'features', 'community', 'security', 'support'];

export const Header = () => {
  const { data, loading } = useUserQuery();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-4 px-4 py-6 lg:px-14">
      <Link href={ROUTES.home} className="text-2xl font-bold text-black">
        Banco
      </Link>

      <nav className="hidden items-center gap-8 text-base font-semibold text-black lg:flex xl:gap-16">
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

      <div className="hidden items-center space-x-2 lg:flex">
        {loading ? null : data?.user.id ? (
          <Link
            href={ROUTES.dashboard}
            className="flex h-[42px] w-[104px] items-center justify-center rounded-lg border border-neutral-200 bg-white text-base font-semibold text-black"
          >
            Go to App
          </Link>
        ) : (
          <>
            <Link
              href={ROUTES.login}
              className="flex h-[42px] w-[104px] items-center justify-center text-base font-semibold text-black"
            >
              Login
            </Link>

            <Link
              href={ROUTES.signup}
              className="flex h-[42px] w-[104px] items-center justify-center rounded-lg border border-neutral-200 bg-white text-base font-semibold text-black"
            >
              Sign up
            </Link>
          </>
        )}
      </div>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <button className="z-10 lg:hidden">
            <Menu size={24} className="text-black" />
          </button>
        </SheetTrigger>

        <SheetContent side="left" className="bg-white text-black">
          <nav className="flex flex-col gap-10 text-lg font-semibold text-black">
            {links.map(l =>
              l !== 'support' ? (
                <button
                  key={l}
                  className="w-fit capitalize"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setTimeout(() => elementScroll('#' + l), 500);
                  }}
                >
                  {l}
                </button>
              ) : (
                <a
                  key={l}
                  href={ROUTES.external.support}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-fit capitalize"
                >
                  {l}
                </a>
              )
            )}
          </nav>

          <div className="mt-10 flex items-center space-x-2 border-t border-neutral-200 pt-10">
            {loading ? null : data?.user.id ? (
              <Link
                href={ROUTES.dashboard}
                className="flex h-[42px] w-full items-center justify-center rounded-lg border border-neutral-200 bg-white text-base font-semibold text-black"
              >
                Go to App
              </Link>
            ) : (
              <>
                <Link
                  href={ROUTES.login}
                  className="flex h-[42px] w-full items-center justify-center text-base font-semibold text-black"
                >
                  Login
                </Link>

                <Link
                  href={ROUTES.signup}
                  className="flex h-[42px] w-full items-center justify-center rounded-lg border border-neutral-200 bg-white text-base font-semibold text-black"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};
