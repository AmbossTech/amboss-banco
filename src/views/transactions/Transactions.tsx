'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { sortBy } from 'lodash';
import { ArrowDown, ArrowUp, Loader2, MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import { cryptoToUsd } from '@/utils/fiat';
import { numberWithPrecisionAndDecimals } from '@/utils/numbers';

import { SimpleTable } from '../wallet/SimpleTable';

type TransactionEntry = {
  id: string;
  tx_id: string;
  balance: string;
  formatted_balance: string;
  date: string | undefined | null;
  fee: string;
  ticker: string;
  precision: number;
  name: string;
  unblinded_url: string;
  blinded_url: string;
};

const columns: ColumnDef<TransactionEntry>[] = [
  {
    accessorKey: 'direction',
    header: '',
    cell: ({ row }) => {
      const balance = Number(row.original.balance);
      return balance < 0 ? (
        <div>
          <ArrowUp className="size-4" color={'red'} />
        </div>
      ) : (
        <div>
          <ArrowDown className="size-4" color={'green'} />
        </div>
      );
    },
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) =>
      row.original.date ? (
        <div>
          {`${formatDistanceToNowStrict(row.original.date)} ago`}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {format(row.original.date, 'MMM do, yyyy - HH:mm')}
          </p>
        </div>
      ) : (
        'Pending'
      ),
  },
  {
    accessorKey: 'asset',
    header: 'Account',
    cell: ({ row }) => <div className="capitalize">{row.original.name}</div>,
  },
  {
    accessorKey: 'balance',
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('balance'));

      const formatted = numberWithPrecisionAndDecimals(
        amount,
        row.original.precision
      );

      return (
        <div className="text-right">
          {row.original.formatted_balance}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {`${formatted} ${row.original.ticker}`}
          </p>
        </div>
      );
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const payment = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(payment.id)}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(payment.tx_id)}
            >
              Copy Transaction ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(payment.blinded_url)}
            >
              Copy Blinded URL
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(payment.unblinded_url)
              }
            >
              Copy Unblinded URL
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
          tx_id: t.tx_id,
          balance: t.balance,
          formatted_balance: cryptoToUsd(
            t.balance,
            t.asset_info.precision,
            t.asset_info.ticker,
            t.fiat_info.fiat_to_btc
          ),
          date: t.date,
          fee: t.fee,
          ticker: t.asset_info.ticker,
          precision: t.asset_info.precision,
          name: t.asset_info.name,
          unblinded_url: t.unblinded_url,
          blinded_url: t.blinded_url,
        });
      });
    });

    const sorted = sortBy(transactions, t =>
      t.date ? new Date(t.date) : new Date()
    ).reverse();

    return sorted;
  }, [data, loading, error]);

  if (loading) {
    return (
      <div className="my-10 flex w-full justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="scroll-m-20 pb-2 pt-6 text-xl font-semibold tracking-tight first:mt-0">
        {t('transactions')}
      </h2>
      <SimpleTable<TransactionEntry> data={transactions} columns={columns} />
    </div>
  );
};
