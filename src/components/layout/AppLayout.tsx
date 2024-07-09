import {
  Home,
  Landmark,
  LifeBuoy,
  Menu,
  MessageCircle,
  Settings,
  Vault,
} from 'lucide-react';
import Link from 'next/link';
import { FC, ReactNode } from 'react';

import {
  LogoutButton,
  LogoutButtonWithTooltip,
} from '@/components/button/LogoutButton';
import { VaultButton } from '@/components/button/VaultButton';
import { ThemeToggle } from '@/components/toggle/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ROUTES } from '@/utils/routes';

import { WalletButton } from '../button/WalletButton';
import { LanguageToggle } from '../toggle/LanguageToggle';
import { Badge } from '../ui/badge';

export const AppLayout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <TooltipProvider>
      <div className="grid h-screen w-full md:pl-[53px]">
        <aside className="inset-y fixed left-0 z-20 hidden h-full flex-col border-r md:flex">
          <div className="flex items-center justify-center border-b p-2 py-4">
            <Vault className="size-5" />
          </div>
          <nav className="grid gap-1 p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg"
                  aria-label="Wallet"
                  asChild
                >
                  <Link href={ROUTES.dashboard}>
                    <Home className="size-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={5}>
                Home
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg"
                  aria-label="Wallet"
                  asChild
                >
                  <Link href={ROUTES.contacts.home}>
                    <MessageCircle className="size-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={5}>
                Contacts
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
                  asChild
                >
                  <Link href={'mailto:info@amboss.tech'}>
                    <LifeBuoy className="size-5" />
                  </Link>
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
                    href={ROUTES.dashboard}
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <Landmark className="h-5 w-5" />
                    Home
                  </Link>
                </nav>
                <nav className="grid gap-2 font-medium">
                  <Link
                    href={ROUTES.contacts.home}
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Chat
                  </Link>
                </nav>
                <div className="mt-auto">
                  <LogoutButton />
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center justify-center gap-4">
              <h1 className="text-xl font-black">BANCO</h1>

              <Badge variant={'destructive'} className="hidden md:block">
                Alpha - Limit funds and use at your own risk.
              </Badge>
            </div>

            <div className="hidden gap-2 md:flex">
              <WalletButton />
              <VaultButton />
              <ThemeToggle />
              <LanguageToggle />
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
                <div className="mt-6 flex gap-2">
                  <VaultButton />
                  <ThemeToggle />
                  <LanguageToggle />
                </div>
              </SheetContent>
            </Sheet>
          </header>

          <Badge
            variant={'destructive'}
            className="mx-4 mt-2 block text-center md:hidden"
          >
            Alpha - Limit funds and use at your own risk.
          </Badge>

          <main className="flex flex-col justify-center px-4">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
};
