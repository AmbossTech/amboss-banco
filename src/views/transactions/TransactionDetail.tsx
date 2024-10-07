'use client';

import { format } from 'date-fns';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  Copy,
  Ellipsis,
  Link as LinkIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FC, useMemo, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { cn } from '@/utils/cn';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import { cryptoToUsd } from '@/utils/fiat';
import { numberWithPrecisionAndDecimals } from '@/utils/numbers';
import { ROUTES } from '@/utils/routes';

export const TransactionDetail: FC<{ id: string }> = ({ id }) => {
  const t = useTranslations('App.Wallet.Transactions');
  const { toast } = useToast();

  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const [assetFirst, setAssetFirst] = useState(false);

  const { data, loading, error } = useGetWalletQuery({
    variables: { id: value },
    skip: !value,
    onCompleted: data => {
      const tx = data?.wallets.find_one.accounts
        .find(a => a.liquid)
        ?.liquid?.transactions.find(t => t.id === id);

      if (!tx) {
        toast({
          variant: 'destructive',
          title: 'Transaction not found.',
        });
      }
    },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error getting transaction.',
        description: messages.join(', '),
      });
    },
  });

  const transaction = useMemo(
    () =>
      data?.wallets.find_one.accounts
        .find(a => a.liquid)
        ?.liquid?.transactions.find(t => t.id === id),
    [data?.wallets.find_one.accounts, id]
  );

  if (loading || error || !transaction)
    return (
      <div className="mx-auto w-full max-w-lg py-4 lg:py-10">
        <div className="flex w-full items-center justify-between space-x-2">
          <Link
            href={ROUTES.transactions.home}
            className="transition-opacity hover:opacity-75"
          >
            <ArrowLeft size={24} />
          </Link>

          <h1 className="text-2xl font-semibold">{t('details')}</h1>

          <button disabled className="cursor-not-allowed opacity-50">
            <Ellipsis size={24} />
          </button>
        </div>

        {loading ? (
          <div className="mt-6 space-y-2">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-[228px] w-full rounded-2xl" />
          </div>
        ) : null}
      </div>
    );

  const balance = Number(transaction.balance);

  const fiatBalance = cryptoToUsd(
    transaction.balance,
    transaction.asset_info.precision,
    transaction.asset_info.ticker,
    transaction.fiat_info.fiat_to_btc
  );

  const prefixFiatBalance = fiatBalance.includes('-')
    ? '-' + fiatBalance.replaceAll('-', '')
    : '+' + fiatBalance;

  const assetBalance = numberWithPrecisionAndDecimals(
    parseFloat(transaction.balance),
    transaction.asset_info.precision
  );

  const prefixAssetBalance =
    (assetBalance.includes('-') ? assetBalance : '+' + assetBalance) +
    ' ' +
    transaction.asset_info.ticker;

  return (
    <div className="mx-auto w-full max-w-lg py-4 lg:py-10">
      <div className="mb-6 flex w-full items-center justify-between space-x-2">
        <Link
          href={ROUTES.transactions.home}
          className="transition-opacity hover:opacity-75"
        >
          <ArrowLeft size={24} />
        </Link>

        <h1 className="text-xl font-semibold sm:text-2xl">{t('details')}</h1>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="transition-opacity hover:opacity-75">
              <Ellipsis size={24} />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="flex items-center space-x-3"
              onClick={() => navigator.clipboard.writeText(transaction.id)}
            >
              <Copy size={16} />
              <p>{t('copy-id')}</p>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex items-center space-x-3"
              onClick={() => navigator.clipboard.writeText(transaction.tx_id)}
            >
              <Copy size={16} />
              <p>{t('copy-tx')}</p>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex items-center space-x-3"
              onClick={() =>
                navigator.clipboard.writeText(transaction.blinded_url)
              }
            >
              <LinkIcon size={16} />
              <p>{t('blinded')}</p>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex items-center space-x-3"
              onClick={() =>
                navigator.clipboard.writeText(transaction.unblinded_url)
              }
            >
              <LinkIcon size={16} />
              <p>{t('unblinded')}</p>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <div className="w-full rounded-2xl bg-slate-100 px-2 pb-6 pt-4 dark:bg-neutral-900">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-neutral-800">
            {balance < 0 ? (
              <ArrowUp size={24} />
            ) : (
              <ArrowDown size={24} className="text-green-400" />
            )}
          </div>

          <p className="mb-3 text-center text-sm font-medium text-slate-600 dark:text-neutral-400">
            {balance < 0 ? t('sent') : t('received')}
          </p>

          <p className="mb-2 text-center text-3xl font-medium">
            {assetFirst ? prefixAssetBalance : prefixFiatBalance}
          </p>

          <div className="flex items-center justify-center space-x-2 text-slate-600 dark:text-neutral-400">
            <p className="text-sm font-medium">
              {assetFirst ? prefixFiatBalance : prefixAssetBalance}
            </p>

            <button onClick={() => setAssetFirst(f => !f)}>
              <ArrowUpDown size={14} />
            </button>
          </div>
        </div>

        <div className="w-full space-y-3 rounded-2xl bg-slate-100 px-4 py-3 dark:bg-neutral-900">
          <div className="flex w-full items-center justify-between space-x-2">
            <p className="font-medium text-slate-600 dark:text-neutral-400">
              {t('date')}
            </p>

            <p>
              {transaction.date
                ? format(transaction.date, 'MMM dd, yyyy')
                : '-'}
            </p>
          </div>

          <div className="flex w-full items-center justify-between space-x-2">
            <p className="font-medium text-slate-600 dark:text-neutral-400">
              {t('time')}
            </p>

            <p>{transaction.date ? format(transaction.date, 'HH:mm') : '-'}</p>
          </div>

          <div className="flex w-full items-center justify-between space-x-2">
            <p className="font-medium text-slate-600 dark:text-neutral-400">
              {t('status')}
            </p>

            <p className={cn(transaction.date && 'text-green-400')}>
              {transaction.date ? t('paid') : t('pending')}
            </p>
          </div>

          <div className="flex w-full items-center justify-between space-x-2">
            <p className="font-medium text-slate-600 dark:text-neutral-400">
              {t('amount')}
            </p>

            <p>{fiatBalance.replaceAll('-', '')}</p>
          </div>

          <div className="flex w-full items-center justify-between space-x-2">
            <p className="font-medium text-slate-600 dark:text-neutral-400">
              {t('asset')}
            </p>

            <p>{transaction.asset_info.name}</p>
          </div>

          <div className="flex w-full items-center justify-between space-x-2">
            <p className="font-medium text-slate-600 dark:text-neutral-400">
              {t('fees')}
            </p>

            <p>{Number(transaction.fee).toLocaleString('en-US')} sats</p>
          </div>
        </div>
      </div>
    </div>
  );
};
