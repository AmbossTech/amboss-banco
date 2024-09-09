'use client';

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Eye,
  EyeOff,
  RefreshCw,
  Settings2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react';

import smallCircular from '/public/icons/small-circular.svg';
import smallCircularLight from '/public/icons/small-circular-light.svg';
import liquid from '/public/images/liquid.jpg';
import tether from '/public/images/tether.png';
import { Button, IconButton } from '@/components/ui/button-v2';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useRefreshWalletMutation } from '@/graphql/mutations/__generated__/refreshWallet.generated';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { cn } from '@/utils/cn';
import { handleApolloError } from '@/utils/error';
import { cryptoToUsd, formatFiat } from '@/utils/fiat';
import { ROUTES } from '@/utils/routes';

import { DashboardView } from '../dashboard/Dashboard';

type AssetBalance = {
  accountId: string;
  name: string;
  ticker: string;
  balance: string;
  formatted_balance: string;
  precision: number;
  assetId: string;
};

const AssetLogo: FC<{ ticker: string }> = ({ ticker }) => {
  const classname = 'h-10 w-10 rounded-full object-cover';

  switch (ticker) {
    case 'USDT':
      return <Image src={tether} alt="tether" className={classname} />;
    case 'BTC':
      return <Image src={liquid} alt="liquid" className={classname} />;
    default:
      return <div className="h-10 w-10 rounded-full bg-primary" />;
  }
};

export const WalletInfo: FC<{
  id: string;
  view: DashboardView;
  setView: Dispatch<SetStateAction<DashboardView>>;
}> = ({ id, view, setView }) => {
  const t = useTranslations('App.Wallet');
  const { toast } = useToast();

  const [hideBalance, setHideBalance] = useState(false);

  const { data, loading, error } = useGetWalletQuery({
    variables: { id },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error getting wallet.',
        description: messages.join(', '),
      });
    },
  });

  const [refresh, { loading: refreshLoading }] = useRefreshWalletMutation({
    variables: { input: { wallet_id: id } },
    refetchQueries: ['getWallet'],
    onCompleted: () => toast({ title: 'Wallet Refreshed!' }),
    onError: () =>
      toast({
        variant: 'destructive',
        title: 'Error refeshing wallet.',
      }),
  });

  const accountId = useMemo(
    () => data?.wallets.find_one.accounts.find(a => a.liquid)?.id || '',
    [data?.wallets.find_one.accounts]
  );

  const balances = useMemo(() => {
    if (loading || error) return [];
    if (!data?.wallets.find_one.accounts.length) return [];

    const { accounts } = data.wallets.find_one;

    const mapped: AssetBalance[] = [];

    accounts.forEach(a => {
      if (!a.liquid) return;

      a.liquid.assets.forEach(l => {
        mapped.push({
          accountId: a.id,
          assetId: l.asset_id,
          name: l.asset_info.name,
          ticker: l.asset_info.ticker,
          balance: l.balance,
          formatted_balance: cryptoToUsd(
            l.balance,
            l.asset_info.precision,
            l.asset_info.ticker,
            l.fiat_info.fiat_to_btc
          ),
          precision: l.asset_info.precision,
        });
      });
    });

    return mapped;
  }, [data, loading, error]);

  const totalBalance = useMemo(() => {
    const total = balances.reduce((a, c) => {
      if (c.formatted_balance === '-') return a;

      const numberBalance = Number(
        c.formatted_balance.slice(1, c.formatted_balance.length)
      );

      return a + numberBalance;
    }, 0);

    return formatFiat(total);
  }, [balances]);

  const balancePercentages = useMemo(
    () =>
      balances
        .map(b => {
          if (b.formatted_balance === '-') return { ...b, percent: 0 };

          const numberBalance = Number(
            b.formatted_balance.slice(1, b.formatted_balance.length)
          );

          const numberTotalBalance = Number(
            totalBalance.slice(1, totalBalance.length)
          );

          const percent =
            numberTotalBalance > 0
              ? Number(((numberBalance / numberTotalBalance) * 100).toFixed(0))
              : 0;

          return { ...b, percent };
        })
        .sort((a, b) => b.percent - a.percent),
    [balances, totalBalance]
  );

  if (loading)
    return (
      <div className="h-52 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-neutral-900" />
    );

  if (error) return null;

  if (view === 'asset') return <></>;

  if (view === 'assets')
    return (
      <div className="relative">
        <button
          onClick={() => setView('default')}
          className="absolute left-0 top-0 transition-opacity hover:opacity-75 lg:-left-16"
        >
          <ArrowLeft size={24} />
        </button>

        <Link
          href={ROUTES.wallet.settings(id)}
          className="absolute right-0 top-0 transition-opacity hover:opacity-75 lg:-right-16"
        >
          <Settings2 size={24} />
        </Link>

        <p className="mx-auto mb-4 max-w-[232px] text-center text-2xl font-semibold sm:max-w-none">
          {data?.wallets.find_one.name}
        </p>

        <p className="mb-4 text-center text-4xl font-semibold lg:text-5xl">
          {totalBalance}
        </p>

        <div className="mb-6 flex justify-center space-x-3">
          <Button asChild>
            <Link
              href={ROUTES.wallet.receive(id, accountId)}
              className="flex w-full max-w-32 items-center justify-center space-x-2"
            >
              <p>{t('receive')}</p> <ArrowDown size={16} />
            </Link>
          </Button>

          <Button asChild variant="secondary">
            <Link
              href={ROUTES.wallet.send.home(id, accountId)}
              className="flex w-full max-w-32 items-center justify-center space-x-2"
            >
              <p>{t('send')}</p> <ArrowUp size={16} />
            </Link>
          </Button>
        </div>

        <div className="mb-6 h-px w-full bg-slate-200 dark:bg-neutral-800" />

        <p className="text-center text-2xl font-semibold">{t('assets')}</p>

        <div className="my-6 flex w-full flex-wrap items-end justify-evenly">
          {balancePercentages.map(b => {
            const width = `w-[${b.percent}%]`;
            const height = `h-[${b.percent}%]`;

            return (
              <div
                key={b.assetId}
                className={cn(
                  'relative min-h-20 min-w-20 rounded-full bg-slate-200 text-center text-sm font-medium dark:bg-neutral-500',
                  width,
                  height
                )}
              >
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <p>{b.ticker === 'USDT' ? b.formatted_balance : b.balance}</p>
                  <p>{b.ticker}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          {balancePercentages.map(b => (
            <div
              key={b.assetId}
              className="flex w-full items-center justify-between rounded-xl bg-slate-100 px-2 py-1 dark:bg-neutral-900"
            >
              <div className="flex items-center space-x-2">
                <AssetLogo ticker={b.ticker} />

                <p className="font-medium">
                  {b.name} ({b.ticker})
                </p>
              </div>

              <div>
                <p className="font-medium">{b.formatted_balance}</p>

                <p className="text-right text-sm text-slate-600 dark:text-neutral-400">
                  {b.percent}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  return (
    <Card className="relative">
      <Image
        src={smallCircular}
        alt="circles"
        className="absolute right-0 top-1/2 hidden -translate-y-1/2 dark:block"
      />
      <Image
        src={smallCircularLight}
        alt="circles"
        className="absolute right-0 top-1/2 -translate-y-1/2 dark:hidden"
      />

      <div className="mb-3 flex w-full justify-between space-x-2">
        <button
          onClick={() => setView('assets')}
          disabled={refreshLoading}
          className="z-10 h-fit font-semibold text-primary transition-colors hover:text-primary-hover"
        >
          {data?.wallets.find_one.name}
        </button>

        <div className="flex space-x-2">
          <IconButton
            icon={hideBalance ? <EyeOff size={20} /> : <Eye size={20} />}
            onClick={() => setHideBalance(h => !h)}
            className="z-10"
          />

          <IconButton
            icon={
              <RefreshCw
                size={20}
                className={cn(refreshLoading && 'animate-spin')}
              />
            }
            onClick={() => refresh()}
            disabled={refreshLoading}
            className="z-10"
          />
        </div>
      </div>

      <button
        onClick={() => setView('assets')}
        disabled={refreshLoading}
        className="relative z-10 mb-1 text-4xl font-semibold"
      >
        {hideBalance ? '***' : totalBalance}
      </button>

      <div className="mb-4 flex flex-wrap gap-6">
        {balancePercentages.map(b => (
          <p
            key={b.assetId}
            className="z-10 text-sm font-medium text-slate-600 dark:text-neutral-400 lg:text-base"
          >
            {hideBalance ? '***' : b.formatted_balance} {b.ticker}
          </p>
        ))}
      </div>

      <div className="flex space-x-3">
        <Button asChild>
          <Link
            href={ROUTES.wallet.receive(id, accountId)}
            className="z-10 flex w-full max-w-32 items-center justify-center space-x-2"
          >
            <p>{t('receive')}</p> <ArrowDown size={16} />
          </Link>
        </Button>

        <Button asChild variant="secondary">
          <Link
            href={ROUTES.wallet.send.home(id, accountId)}
            className="z-10 flex w-full max-w-32 items-center justify-center space-x-2"
          >
            <p>{t('send')}</p> <ArrowUp size={16} />
          </Link>
        </Button>
      </div>
    </Card>
  );
};
