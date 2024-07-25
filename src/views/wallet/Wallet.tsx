'use client';

import { sortBy } from 'lodash';
import { Bitcoin, DollarSign, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FC, useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { cryptoToUsd } from '@/utils/fiat';
import { numberWithPrecisionAndDecimals } from '@/utils/numbers';
import { TransactionTable } from '@/views/wallet/TxTable';

type AssetBalance = {
  accountId: string;
  name: string;
  ticker: string;
  balance: string;
  formatted_balance: string;
  precision: number;
};

export type TransactionEntry = {
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

const BalanceIcon: FC<{ ticker: string }> = ({ ticker }) => {
  const classname = 'h-4 w-4 text-muted-foreground';
  switch (ticker) {
    case 'USDT':
      return <DollarSign className={classname} />;
    case 'BTC':
      return <Bitcoin className={classname} />;
    default:
      return null;
  }
};

const BalanceCard: FC<{
  input: AssetBalance;
}> = ({ input: { balance, name, precision, ticker, formatted_balance } }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="mr-4 text-sm font-medium">{name}</CardTitle>
        <BalanceIcon ticker={ticker} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatted_balance}</div>
        <p className="text-xs text-muted-foreground">{`${numberWithPrecisionAndDecimals(balance, precision)} ${ticker}`}</p>
      </CardContent>
    </Card>
  );
};

export const WalletInfo: FC<{ id: string }> = ({ id }) => {
  const t = useTranslations('Index');

  const { data, loading, error } = useGetWalletQuery({ variables: { id } });

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
        {t('accounts')}
      </h2>
      <div className="flex w-full flex-col gap-4 md:flex-row">
        {balances.map((b, index) => (
          <BalanceCard input={b} key={`${b.ticker}${index}`} />
        ))}
      </div>
      <h2 className="scroll-m-20 pb-2 pt-6 text-xl font-semibold tracking-tight first:mt-0">
        {t('transactions')}
      </h2>
      <TransactionTable data={transactions} />
    </div>
  );
};
