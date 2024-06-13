'use client';

import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { CircleEqual, PlusCircle, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useGetAllWalletsQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { cn } from '@/lib/utils';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { ROUTES } from '@/utils/routes';

import { RefreshWallet } from './RefreshWallet';

export function WalletButton() {
  const [open, setOpen] = useState(false);

  const { push } = useRouter();

  const { data, error } = useGetAllWalletsQuery();

  const [value, setValue] = useLocalStorage(
    LOCALSTORAGE_KEYS.currentWalletId,
    ''
  );

  useEffect(() => {
    if (value) return;
    if (!data?.wallets.find_many.length) return;

    setValue(data.wallets.find_many[0].id);
  }, [value, data, setValue]);

  const wallets = useMemo(() => {
    // return [];
    const walletData = data?.wallets.find_many || [];

    return walletData.map(w => {
      return { value: w.id, label: w.name };
    });
  }, [data]);

  const buttonText = useMemo(() => {
    if (!wallets.length) return 'Create a wallet';
    if (value) {
      return wallets.find(w => w.value === value)?.label || 'Select wallet...';
    }
  }, [wallets, value]);

  if (error) return null;
  if (!buttonText) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {buttonText}

          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            {wallets.length ? (
              <CommandGroup heading="Wallets">
                {wallets.map(w => (
                  <CommandItem
                    className="cursor-pointer"
                    key={w.value}
                    value={w.value}
                    onSelect={currentValue => {
                      setValue(currentValue);
                      push(ROUTES.app.home);
                      setOpen(false);
                    }}
                  >
                    {w.label}
                    <CheckIcon
                      className={cn(
                        'ml-auto h-4 w-4',
                        value === w.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {!!value && wallets.length ? (
              <CommandGroup heading="Current Wallet">
                <RefreshWallet walletId={value} />
                <CommandItem
                  className="cursor-pointer"
                  onSelect={() => {
                    setOpen(false);
                  }}
                >
                  <Link
                    href={ROUTES.app.wallet.settings(value)}
                    className="flex w-full items-center justify-between"
                  >
                    Settings
                    <Settings className="ml-auto size-4" />
                  </Link>
                </CommandItem>
              </CommandGroup>
            ) : null}

            <CommandGroup heading="Actions">
              <CommandItem
                className="cursor-pointer"
                onSelect={() => {
                  setOpen(false);
                }}
              >
                <Link
                  href={ROUTES.setup.wallet.new}
                  className="flex w-full items-center justify-between"
                >
                  New Wallet
                  <PlusCircle className={cn('ml-auto h-4 w-4')} />
                </Link>
              </CommandItem>
              <CommandItem
                className="cursor-pointer"
                onSelect={() => {
                  setOpen(false);
                }}
              >
                <Link
                  href={ROUTES.setup.wallet.restore}
                  className="flex w-full items-center justify-between"
                >
                  Restore Wallet
                  <CircleEqual className={cn('ml-auto h-4 w-4')} />
                </Link>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
