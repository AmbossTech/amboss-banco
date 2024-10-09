'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { SquareArrowLeft, SquareArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Fragment } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

type TableProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  loading: boolean;
};

export const SwapsTable = <T,>({
  data,
  columns,
  loading,
}: TableProps<T>): JSX.Element => {
  const t = useTranslations();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  });

  return (
    <div className="w-full max-w-[calc(100dvw-32px)]">
      <div className="mb-4 space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
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
              <p className="font-semibold">{t('App.Wallet.no-results')}</p>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-between space-x-2">
        <div className="text-sm text-slate-600 dark:text-neutral-400">
          {loading ? null : (
            <>
              {table.getFilteredRowModel().rows.length}{' '}
              {t('Index.swaps').slice(0, -1).toLowerCase()}(s)
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
