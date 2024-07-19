'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useLocalStorage } from 'usehooks-ts';

import { useGetWalletSwapsQuery } from '@/graphql/queries/__generated__/swaps.generated';
import { SimpleSwap } from '@/graphql/types';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { numberWithPrecisionAndDecimals } from '@/utils/numbers';

import { SimpleTable } from '../wallet/SimpleTable';

export const columns: ColumnDef<SimpleSwap>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) =>
      row.original.created_at ? (
        <div>
          {`${formatDistanceToNowStrict(row.original.created_at)} ago`}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {format(row.original.created_at, 'MMM do, yyyy - HH:mm')}
          </p>
        </div>
      ) : (
        'Pending'
      ),
  },
  {
    accessorKey: 'pair',
    header: 'Pair',
    cell: ({ row }) => (
      <div className="flex items-center justify-start gap-2">
        <div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            From
          </p>
          <div className="flex gap-1">
            {row.original.deposit_amount ? (
              <p>
                {numberWithPrecisionAndDecimals(row.original.deposit_amount, 0)}
              </p>
            ) : null}
            <p>{row.original.deposit_coin}</p>
          </div>
        </div>

        <ChevronRight className="size-4" />

        <div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">To</p>
          <div className="flex gap-1">
            {row.original.settle_amount ? (
              <p>
                {numberWithPrecisionAndDecimals(row.original.settle_amount, 0)}
              </p>
            ) : null}
            <p>{row.original.settle_coin}</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'provider',
    header: 'Provider',
    cell: ({ row }) => <div>{row.original.provider}</div>,
  },
];

export const Swaps = () => {
  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const { data, loading, error } = useGetWalletSwapsQuery({
    variables: { id: value },
  });

  console.log(data?.wallets?.find_one?.swaps?.find_many?.[0]);

  return (
    <div className="py-4">
      <h2 className="scroll-m-20 pb-4 text-xl font-semibold tracking-tight">
        Swaps
      </h2>
      {loading ? (
        <div className="my-10 flex w-full justify-center">
          <Loader2 className="animate-spin" />
        </div>
      ) : error ? (
        <div className="my-4 flex w-full justify-center">
          <p className="text-sm text-muted-foreground">
            Error loading wallet swaps
          </p>
        </div>
      ) : (
        <SimpleTable<SimpleSwap>
          data={data?.wallets.find_one.swaps.find_many || []}
          columns={columns}
        />
      )}
    </div>
  );
};
