'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FC, useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { useGetAllWalletsQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { useWalletInfo } from '@/hooks/wallet';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import { ROUTES } from '@/utils/routes';

import { WalletInfo } from '../wallet/WalletInfo';
import { BancoCode } from './BancoCode';
import { RecentContacts } from './RecentContacts';

export type DashboardView = 'default' | 'assets' | 'asset';

const Warning: FC<{ id: string }> = ({ id }) => {
  const t = useTranslations('App.Dashboard');

  const { loading, error, liquidAssets } = useWalletInfo(id);

  const showAlert = useMemo(() => {
    const otherAssets = liquidAssets.filter(
      a => a.asset_info.ticker !== 'BTC' && !!a.balance
    );

    const btcAsset = liquidAssets.filter(
      a => a.asset_info.ticker == 'BTC' && !!a.balance
    );

    return !!otherAssets.length && !btcAsset.length;
  }, [liquidAssets]);

  if (loading || error) return null;
  if (!liquidAssets.length) return null;
  if (!showAlert) return null;

  return (
    <Alert>
      <AlertTriangle size={16} />
      <AlertTitle>{t('warning-title')}</AlertTitle>
      <AlertDescription>{t('warning')}</AlertDescription>
    </Alert>
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
    <div className="mx-auto w-full max-w-lg space-y-4 py-4 lg:space-y-6 lg:py-10">
      {checkingId ? (
        <Loader2 className="mx-auto size-4 animate-spin" />
      ) : view === 'default' ? (
        <>
          <Warning id={value} />
          <BancoCode id={value} />
          <WalletInfo id={value} view={view} setView={setView} />
          <RecentContacts id={value} />
        </>
      ) : (
        <WalletInfo id={value} view={view} setView={setView} />
      )}
    </div>
  );
};
