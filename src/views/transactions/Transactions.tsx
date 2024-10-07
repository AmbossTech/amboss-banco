'use client';

import { ColumnDef } from '@tanstack/react-table';
import { sortBy } from 'lodash';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { RefreshButton } from '@/components/button/RefreshButton';
import { useToast } from '@/components/ui/use-toast';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import { cryptoToUsd } from '@/utils/fiat';

import { Transaction } from './Transaction';
import { TransactionsTable } from './TransactionsTable';

export type TransactionEntry = {
  id: string;
  balance: string;
  formatted_balance: string;
  date: string | undefined | null;
  ticker: string;
  precision: number;
  name?: string;
};

const columns: ColumnDef<TransactionEntry>[] = [
  {
    id: 'transaction',
    accessorKey: 'name',
    cell: ({ row }) => {
      return (
        <Transaction
          id={row.original.id}
          balance={row.original.balance}
          precision={row.original.precision}
          date={row.original.date}
          formatted_balance={row.original.formatted_balance}
          ticker={row.original.ticker}
        />
      );
    },
  },
];

export const Transactions = () => {
  const t = useTranslations('Index');

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
          id: t.id,
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

  return (
    <div className="mx-auto w-full max-w-lg py-4 lg:py-10">
      <div className="mb-4 flex w-full items-center justify-between space-x-2">
        <h1 className="text-3xl font-semibold">{t('transactions')}</h1>

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
