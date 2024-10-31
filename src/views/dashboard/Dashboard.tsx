'use client';

import { AlertTriangle, Loader2, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FC, useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Button } from '@/components/ui/button-v2';
import { useToast } from '@/components/ui/use-toast';
import { useGetAllWalletsQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { useWalletInfo } from '@/hooks/wallet';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import { ROUTES } from '@/utils/routes';

import { passwordStrength } from '../settings/Settings';
import { WalletInfo } from '../wallet/WalletInfo';
import { BancoCode } from './BancoCode';
import { RecentContacts } from './RecentContacts';
import { RecentTransactions } from './RecentTransactions';

export type DashboardView = 'default' | 'assets' | 'asset';

const PasswordWarning = () => {
  const t = useTranslations();

  const password = passwordStrength();

  return ['Very Weak', 'Weak'].includes(password) ? (
    <div className="flex w-full items-center justify-between space-x-3 rounded-xl border border-orange-500 px-4 py-2 dark:border-orange-400">
      <div className="flex items-center space-x-3">
        <Shield
          size={24}
          className="shrink-0 text-orange-500 dark:text-orange-400"
        />

        <p className="text-sm">{t('App.Dashboard.secure')}</p>
      </div>

      <Button asChild variant="secondary" className="py-1">
        <Link href={ROUTES.settings.password}>{t('App.Dashboard.go')}</Link>
      </Button>
    </div>
  ) : null;
};

const Warning: FC<{ id: string }> = ({ id }) => {
  const t = useTranslations('App.Dashboard');

  const { loading, error, liquidAssets } = useWalletInfo(id);

  const showAlert = useMemo(() => {
    const otherAssets = liquidAssets.filter(
      a => a.asset_info.ticker !== 'BTC' && Number(a.balance)
    );

    const btcAsset = liquidAssets.filter(
      a => a.asset_info.ticker == 'BTC' && Number(a.balance)
    );

    return otherAssets.length && !btcAsset.length;
  }, [liquidAssets]);

  if (loading || error) return null;
  if (!liquidAssets.length) return null;
  if (!showAlert) return null;

  return (
    <div className="flex w-full items-center space-x-3 rounded-xl border border-orange-500 px-4 py-2 text-sm dark:border-orange-400">
      <AlertTriangle
        size={24}
        className="shrink-0 text-orange-500 dark:text-orange-400"
      />

      <div>
        <p className="font-medium">{t('warning-title')}</p>

        <p>{t('warning')}</p>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const { push } = useRouter();
  const { toast } = useToast();

  const [checkingId, setCheckingId] = useState(true);
  const [view, setView] = useState<DashboardView>('default');

  const [value, setValue] = useLocalStorage(
    LOCALSTORAGE_KEYS.currentWalletId,
    ''
  );

  const { data, loading, error } = useGetAllWalletsQuery({
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error getting wallets.',
        description: messages.join(', '),
      });
    },
  });

  useEffect(() => {
    if (loading || error) return;

    if (!data?.wallets.find_many.length) {
      localStorage.removeItem(LOCALSTORAGE_KEYS.currentWalletId);
      push(ROUTES.setup.wallet.home);
      return;
    }

    const savedWallets = data.wallets.find_many;

    if (value) {
      const wallet = savedWallets.find(w => w.id === value);

      if (wallet) {
        setCheckingId(false);
        return;
      }
    }

    setValue(savedWallets[0].id);
    setCheckingId(false);
  }, [data, loading, error, value, push, setValue]);

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 py-4 lg:py-10">
      {checkingId ? (
        <Loader2 className="mx-auto size-4 animate-spin" />
      ) : view === 'default' ? (
        <>
          <PasswordWarning />
          <Warning id={value} />
          <BancoCode id={value} />
          <WalletInfo id={value} view={view} setView={setView} />
          <RecentContacts id={value} />
          <RecentTransactions id={value} />
        </>
      ) : (
        <WalletInfo id={value} view={view} setView={setView} />
      )}
    </div>
  );
};
