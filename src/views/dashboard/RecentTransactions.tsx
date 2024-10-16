import { sortBy } from 'lodash';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FC, useMemo } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { handleApolloError } from '@/utils/error';
import { cryptoToUsd } from '@/utils/fiat';
import { ROUTES } from '@/utils/routes';

import { Transaction } from '../transactions/Transaction';
import { TransactionEntry } from '../transactions/Transactions';

export const RecentTransactions: FC<{ id: string }> = ({ id }) => {
  const t = useTranslations('App');
  const { toast } = useToast();

  const { data, loading, error } = useGetWalletQuery({
    variables: { id },
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
        });
      });
    });

    const sorted = sortBy(transactions, t =>
      t.date ? new Date(t.date) : new Date()
    ).reverse();

    return sorted.slice(0, 5);
  }, [data, loading, error]);

  return (
    <div>
      <div className="mb-4 flex w-full justify-between space-x-2 lg:mb-6">
        <p className="text-2xl font-semibold">{t('Dashboard.transactions')}</p>

        <Link
          href={ROUTES.transactions.home}
          className="font-medium text-primary transition-colors hover:text-primary-hover"
        >
          {t('view-all')}
        </Link>
      </div>

      <div className="w-full max-w-[calc(100dvw-32px)] space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[52px] w-full rounded-xl" />
          ))
        ) : (
          <>
            {transactions.length ? (
              transactions.map(t => (
                <Transaction
                  key={t.id}
                  id={t.id}
                  balance={t.balance}
                  precision={t.precision}
                  date={t.date}
                  formatted_balance={t.formatted_balance}
                  ticker={t.ticker}
                />
              ))
            ) : (
              <p className="text-sm font-medium text-slate-600 dark:text-neutral-400">
                {t('Wallet.no-results')}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
