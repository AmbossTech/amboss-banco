'use client';

import {
  Check,
  ChevronsUpDown,
  Lock,
  Plus,
  PlusCircle,
  Settings2,
  Unlock,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FC, useEffect, useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Button } from '@/components/ui/button';
import { useUserQuery } from '@/graphql/queries/__generated__/user.generated';
import { useGetAllWalletsQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { useChat, useContactStore } from '@/stores/contacts';
import { useKeyStore } from '@/stores/keys';
import { cn } from '@/utils/cn';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { ROUTES } from '@/utils/routes';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { RefreshWallet } from './RefreshWallet';
import { VaultButton } from './VaultButtonV2';

export const WalletButton: FC<{ className?: string; cbk?: () => void }> = ({
  className,
  cbk,
}) => {
  const t = useTranslations('Index');

  const keys = useKeyStore(s => s.keys);

  const setCurrentContact = useContactStore(s => s.setCurrentContact);
  const setCurrentPaymentOption = useChat(s => s.setCurrentPaymentOption);

  const { push } = useRouter();

  const { data, error, loading } = useGetAllWalletsQuery();
  const { data: userData } = useUserQuery();

  const reachedWalletLimit = useMemo(() => {
    if (!data?.wallets.find_many || !userData?.user.wallet) return true;

    return data.wallets.find_many.length >= userData.user.wallet.wallet_limit;
  }, [data?.wallets.find_many, userData?.user.wallet]);

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
    const walletData = data?.wallets.find_many || [];

    return walletData.map(w => {
      return { value: w.id, label: w.name };
    });
  }, [data]);

  const buttonText = useMemo(() => {
    if (loading) return t('loading') + '...';
    if (!wallets.length) return t('create-wallet');
    if (value) {
      return wallets.find(w => w.value === value)?.label || t('select-wallet');
    }
  }, [loading, wallets, value, t]);

  if (error) return null;
  if (!buttonText) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={loading}>
        <Button
          variant="outline"
          size="lg"
          role="combobox"
          className={cn('w-[200px] justify-between px-4', className)}
        >
          <div className="flex items-center space-x-2">
            {keys ? (
              <Unlock size={20} color="green" className="shrink-0" />
            ) : (
              <Lock size={20} color="red" className="shrink-0" />
            )}

            <p className="text-base font-semibold">{buttonText}</p>
          </div>

          <ChevronsUpDown className="ml-2 shrink-0" size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[200px]" align="end">
        {!!value && wallets.length ? (
          <>
            <RefreshWallet
              walletId={value}
              fullScan={false}
              title={t('refresh')}
            />
            <RefreshWallet
              walletId={value}
              fullScan={true}
              title={t('full-refresh')}
            />
            <DropdownMenuItem asChild>
              <Link
                href={ROUTES.wallet.settings}
                onClick={() => cbk?.()}
                className="flex items-center"
              >
                <Settings2 size={16} className="mr-3" />
                {t('settings')}
              </Link>
            </DropdownMenuItem>
            <VaultButton
              unstyled
              className="flex w-full cursor-pointer select-none items-center justify-start space-x-3 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            />

            <div className="w-full border-t border-slate-200 dark:border-[#5A5A5A]" />
          </>
        ) : null}

        <p className="text-xs font-semibold uppercase text-slate-600 dark:text-neutral-500">
          {t('wallets')}
        </p>

        {wallets.length
          ? wallets.map(w => (
              <DropdownMenuItem
                key={w.value}
                onClick={() => {
                  setValue(w.value);
                  push(ROUTES.dashboard);
                  cbk?.();
                  setCurrentContact(undefined);
                  setCurrentPaymentOption(undefined);
                }}
              >
                {w.label}
                {value === w.value ? (
                  <Check size={16} className="ml-3" />
                ) : null}
              </DropdownMenuItem>
            ))
          : null}

        {!reachedWalletLimit ? (
          <>
            <DropdownMenuItem asChild>
              <Link
                href={ROUTES.setup.wallet.new}
                onClick={() => cbk?.()}
                className="flex items-center"
              >
                <PlusCircle size={16} className="mr-3" />
                {t('new-wallet')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={ROUTES.setup.wallet.restore}
                onClick={() => cbk?.()}
                className="flex items-center"
              >
                <Plus size={16} className="mr-3" />
                {t('restore-wallet')}
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
