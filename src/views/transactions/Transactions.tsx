'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { sortBy } from 'lodash';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { RefreshButton } from '@/components/button/RefreshButton';
import { useToast } from '@/components/ui/use-toast';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { cn } from '@/utils/cn';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import { cryptoToUsd } from '@/utils/fiat';
import { numberWithPrecisionAndDecimals } from '@/utils/numbers';

import { TransactionsTable } from './TransactionsTable';

type TransactionEntry = {
  tx_id: string;
  balance: string;
  formatted_balance: string;
  date: string | undefined | null;
  ticker: string;
  precision: number;
  name: string;
};

export const Transactions = () => {
  const t = useTranslations();
  const locale = useLocale();

  const { toast } = useToast();

  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const { data, loading, error } = useGetWalletQuery({
    variables: { id: value },
    skip: !value,
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error getting transactions.',
        description: messages.join(', '),
      });
    },
  });

  const transactions = useMemo(() => {
    if (loading || error) return [];
    if (!data?.wallets.find_one.accounts.length) return [];

    const { accounts } = data.wallets.find_one;

    const transactions: TransactionEntry[] = [];

    accounts.forEach(a => {
      if (!a.liquid) return;

      a.liquid.transactions.forEach(t => {
        transactions.push({
          tx_id: t.tx_id,
          balance: t.balance,
          formatted_balance: cryptoToUsd(
            t.balance,
            t.asset_info.precision,
            t.asset_info.ticker,
            t.fiat_info.fiat_to_btc
          ),
          date: t.date,
          ticker: t.asset_info.ticker,
          precision: t.asset_info.precision,
          name: t.asset_info.name,
        });
      });
    });

    const sorted = sortBy(transactions, t =>
      t.date ? new Date(t.date) : new Date()
    ).reverse();

    return sorted;
  }, [data, loading, error]);

  const columns: ColumnDef<TransactionEntry>[] = useMemo(
    () => [
      {
        id: 'transaction',
        accessorKey: 'name',
        cell: ({ row }) => {
          const balance = Number(row.original.balance);

          const formatted = numberWithPrecisionAndDecimals(
            parseFloat(row.original.balance),
            row.original.precision
          );

          return (
            <div className="flex w-full items-center justify-between space-x-2 overflow-x-auto whitespace-nowrap rounded-xl bg-slate-100 px-2 py-1 dark:bg-neutral-900">
              <div className="flex items-center space-x-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-neutral-800">
                  {balance < 0 ? (
                    <ArrowUp size={24} />
                  ) : (
                    <ArrowDown size={24} className="text-green-400" />
                  )}
                </div>

                {row.original.date ? (
                  <div>
                    <p className="font-medium">
                      {formatDistanceToNowStrict(row.original.date, {
                        locale: locale === 'es' ? es : undefined,
                      }) +
                        ' ' +
                        t('App.Wallet.Transactions.ago')}
                    </p>

                    <p className="text-sm text-slate-600 dark:text-neutral-400">
                      {format(row.original.date, 'MMM dd, yyyy')}
                    </p>
                  </div>
                ) : (
                  <p>{t('App.Wallet.Transactions.pending')}</p>
                )}
              </div>

              <div className="text-right">
                <p
                  className={cn('font-medium', balance > 0 && 'text-green-400')}
                >
                  {row.original.formatted_balance.includes('-')
                    ? '-' + row.original.formatted_balance.replaceAll('-', '')
                    : '+' + row.original.formatted_balance}
                </p>

                <p className="text-sm text-slate-600 dark:text-neutral-400">
                  {formatted.includes('-') ? formatted : '+' + formatted}{' '}
                  {row.original.ticker}
                </p>
              </div>
            </div>
          );
        },
      },
    ],
    [locale, t]
  );

  return (
    <div className="mx-auto w-full max-w-lg py-4 lg:py-10">
      <div className="mb-4 flex w-full items-center justify-between space-x-2">
        <h1 className="text-3xl font-semibold">{t('Index.transactions')}</h1>

        <RefreshButton />
      </div>

      <TransactionsTable<TransactionEntry>
        data={transactions}
        columns={columns}
        loading={loading}
      />
    </div>
  );
};
