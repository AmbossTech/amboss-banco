import { LifeBuoy, Menu, Settings, Vault, Wallet } from 'lucide-react';
import Link from 'next/link';
import { FC, ReactNode } from 'react';

import {
  LogoutButton,
  LogoutButtonWithTooltip,
} from '@/components/button/LogoutButton';
import { VaultButton } from '@/components/button/VaultButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ROUTES } from '@/utils/routes';

export const AppLayout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <TooltipProvider>
      <div className="grid h-screen w-full md:pl-[53px]">
        <aside className="inset-y fixed  left-0 z-20 hidden h-full flex-col border-r md:flex">
          <div className="border-b p-2">
            <Button asChild variant="outline" size="icon" aria-label="Home">
              <Link href={ROUTES.app.home}>
                <Vault className="size-5" />
              </Link>
            </Button>
          </div>
          <nav className="grid gap-1 p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg bg-muted"
                  aria-label="Wallet"
                  asChild
                >
                  <Link href={ROUTES.app.wallet.home}>
                    <Wallet className="size-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={5}>
                Wallets
              </TooltipContent>
            </Tooltip>
          </nav>
          <nav className="mt-auto grid gap-1 p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-auto rounded-lg"
                  aria-label="Help"
                >
                  <LifeBuoy className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={5}>
                Help
              </TooltipContent>
            </Tooltip>
            <LogoutButtonWithTooltip />
          </nav>
        </aside>
        <div className="flex flex-col">
          <header className="sticky top-0 z-10 flex h-[53px] items-center justify-between gap-1 border-b bg-background px-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <nav className="grid gap-2 font-medium">
                  <Link
                    href={ROUTES.app.home}
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <Wallet className="h-5 w-5" />
                    Wallets
                  </Link>
                </nav>
                <div className="mt-auto">
                  <LogoutButton />
                </div>
              </SheetContent>
            </Sheet>

            <h1 className="text-xl font-bold">Banco</h1>

            <div className="hidden gap-2 md:flex">
              <VaultButton />
              <ThemeToggle />
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Toggle settings menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col">
                <div className="flex gap-2">
                  <VaultButton />
                  <ThemeToggle />
                </div>
              </SheetContent>
            </Sheet>
          </header>
          <main className="flex flex-col justify-center px-4">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
};
