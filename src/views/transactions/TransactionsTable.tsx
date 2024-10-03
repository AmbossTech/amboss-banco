'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { SquareArrowLeft, SquareArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Fragment, useMemo, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

type TableProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  loading: boolean;
};

export const TransactionsTable = <T,>({
  data,
  columns,
  loading,
}: TableProps<T>): JSX.Element => {
  const t = useTranslations();

  const filterOptions = useMemo(
    () => [t('App.Wallet.Transactions.all'), 'Liquid Bitcoin', 'Tether USD'],
    [t]
  );

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: {},
    state: {
      columnFilters,
    },
    initialState: { pagination: { pageSize: 5 } },
  });

  return (
    <div className="w-full max-w-[calc(100dvw-32px)]">
      <div className="flex flex-wrap gap-2">
        {filterOptions.map(o => (
          <button
            key={o}
            onClick={() => {
              if (o !== t('App.Wallet.Transactions.all')) {
                table.getColumn('transaction')?.setFilterValue(o);
              } else {
                table.getColumn('transaction')?.setFilterValue('');
              }
            }}
            disabled={loading}
            className={cn(
              'rounded-full border border-slate-200 px-3 py-1.5 font-medium text-foreground transition-all hover:border-foreground hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800',
              ((!table.getState().columnFilters.length &&
                o === t('App.Wallet.Transactions.all')) ||
                table.getState().columnFilters[0]?.value === o) &&
                'border-foreground bg-foreground text-background'
            )}
          >
            {o}
          </button>
        ))}
      </div>

      <div className="my-4 space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[52px] w-full rounded-xl" />
          ))
        ) : (
          <>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <Fragment key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <Fragment key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </Fragment>
                  ))}
                </Fragment>
              ))
            ) : (
              <p className="font-semibold">
                {t('App.Wallet.Transactions.no-results')}
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-between space-x-2">
        <div className="text-sm text-slate-600 dark:text-neutral-400">
          {loading ? null : (
            <>
              {table.getFilteredRowModel().rows.length}{' '}
              {t('Index.transactions').slice(0, -1).toLowerCase()}(s)
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || loading}
            className="transition-opacity hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SquareArrowLeft size={24} />
          </button>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || loading}
            className="transition-opacity hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SquareArrowRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
