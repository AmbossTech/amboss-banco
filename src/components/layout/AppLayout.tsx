import {
  ArrowLeftRight,
  Home,
  LifeBuoy,
  Menu,
  MessageCircle,
  ScrollText,
  Settings,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FC, ReactNode, useMemo, useState } from 'react';

import {
  LogoutButton,
  LogoutButtonWithTooltip,
} from '@/components/button/LogoutButton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUserQuery } from '@/graphql/queries/__generated__/user.generated';
import { useGetAllWalletsQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { ROUTES } from '@/utils/routes';

import { WalletButton } from '../button/WalletButton';
import { Logo } from '../Logo';
import { Badge } from '../ui/badge';
import { Button as ButtonV2 } from '../ui/button-v2';

export const AppLayout: FC<{ children: ReactNode }> = ({ children }) => {
  const t = useTranslations('Index');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileWalletMenuOpen, setMobileWalletMenuOpen] = useState(false);

  const { data } = useGetAllWalletsQuery();
  const { data: userData } = useUserQuery();

  const reachedWalletLimit = useMemo(() => {
    if (!data?.wallets.find_many || !userData?.user.wallet) return true;

    return data.wallets.find_many.length >= userData.user.wallet.wallet_limit;
  }, [data?.wallets.find_many, userData?.user.wallet]);

  return (
    <div className="grid h-dvh w-full md:pl-[65px]">
      <aside className="inset-y fixed left-0 z-20 hidden h-full flex-col border-r border-slate-200 dark:border-neutral-800 md:flex">
        <nav className="grid gap-1 p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Wallet" asChild>
                <Link href={ROUTES.dashboard}>
                  <Home className="size-6" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={5}>
              {t('home')}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Chat" asChild>
                <Link href={ROUTES.contacts.home}>
                  <MessageCircle className="size-6" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={5}>
              {t('contacts')}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Transactions"
                asChild
              >
                <Link href={ROUTES.transactions.home}>
                  <ScrollText className="size-6" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={5}>
              {t('transactions')}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Swaps" asChild>
                <Link href={ROUTES.swaps.home}>
                  <ArrowLeftRight className="size-6" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={5}>
              {t('swaps')}
            </TooltipContent>
          </Tooltip>
        </nav>
        <nav className="mt-auto grid gap-1 p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Settings" asChild>
                <Link href={ROUTES.settings.home}>
                  <Settings className="size-6" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={5}>
              {t('settings')}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Help" asChild>
                <Link href={'mailto:info@amboss.tech'}>
                  <LifeBuoy className="size-6" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={5}>
              {t('help')}
            </TooltipContent>
          </Tooltip>
          <LogoutButtonWithTooltip />
        </nav>
      </aside>

      <div className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-[65px] items-center justify-between gap-2 border-slate-200 bg-background px-4 dark:border-neutral-800 md:border-b">
          <div className="flex items-center space-x-2 md:block md:space-x-0">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="flex h-10 w-10 shrink-0 items-center justify-center transition-opacity hover:opacity-75 md:hidden">
                  <Menu size={24} />
                  <span className="sr-only">Toggle navigation menu</span>
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col pt-16">
                <Link
                  href={ROUTES.dashboard}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center space-x-3 px-2 font-semibold"
                >
                  <Home size={24} />
                  <p>{t('home')}</p>
                </Link>
                <Link
                  href={ROUTES.contacts.home}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center space-x-3 px-2 font-semibold"
                >
                  <MessageCircle size={24} />
                  <p>{t('contacts')}</p>
                </Link>
                <Link
                  href={ROUTES.transactions.home}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center space-x-3 px-2 font-semibold"
                >
                  <ScrollText size={24} />
                  <p>{t('transactions')}</p>
                </Link>
                <Link
                  href={ROUTES.swaps.home}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center space-x-3 px-2 font-semibold"
                >
                  <ArrowLeftRight size={24} />
                  <p>{t('swaps')}</p>
                </Link>

                <div className="mt-auto space-y-7">
                  <Link
                    href={ROUTES.settings.home}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center space-x-3 px-2 font-semibold"
                  >
                    <Settings size={24} />
                    <p>{t('settings')}</p>
                  </Link>
                  <Link
                    href={'mailto:info@amboss.tech'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center space-x-3 px-2 font-semibold"
                  >
                    <LifeBuoy size={24} />
                    <p>{t('help')}</p>
                  </Link>
                  <LogoutButton />
                </div>
              </SheetContent>
            </Sheet>

            <div className="items-center justify-center gap-4 md:flex">
              <Logo className="w-40 fill-foreground" />

              <Badge
                variant={'destructive'}
                className="hidden cursor-default md:block"
              >
                {t('beta')}
              </Badge>
            </div>
          </div>

          <div className="hidden md:block">
            <WalletButton />
          </div>

          <Sheet
            open={mobileWalletMenuOpen}
            onOpenChange={setMobileWalletMenuOpen}
          >
            <SheetTrigger asChild>
              <button className="flex h-10 w-10 shrink-0 items-center justify-center transition-opacity hover:opacity-75 md:hidden">
                <Wallet size={24} />
                <span className="sr-only">Toggle wallet menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-0">
              <p className="mb-6 text-2xl font-semibold">{t('wallets')}</p>

              <WalletButton
                cbk={() => setMobileWalletMenuOpen(false)}
                className="w-full bg-slate-100 dark:bg-neutral-900"
              />

              <ButtonV2
                asChild={!reachedWalletLimit}
                className="mt-3 w-full text-center"
                disabled={reachedWalletLimit}
              >
                <Link href={ROUTES.setup.wallet.new}>{t('new-wallet')}</Link>
              </ButtonV2>
            </SheetContent>
          </Sheet>
        </header>

        <Badge
          variant={'destructive'}
          className="mx-4 block cursor-default text-center md:hidden"
        >
          {t('beta')}
        </Badge>

        <main className="flex flex-col justify-center px-4">{children}</main>
      </div>
    </div>
  );
};
