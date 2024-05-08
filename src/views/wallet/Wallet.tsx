'use client';

import { sortBy } from 'lodash';
import { FC, useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { numberWithPrecision } from '@/utils/numbers';
import { TransactionTable } from '@/views/wallet/TxTable';

type AssetBalance = {
  name: string;
  ticker: string;
  balance: string;
  precision: number;
};

export type TransactionEntry = {
  id: string;
  tx_id: string;
  balance: string;
  date: string | undefined | null;
  fee: string;
  ticker: string;
  precision: number;
  name: string;
  unblinded_url: string;
  blinded_url: string;
};

const BalanceCard: FC<{ input: AssetBalance }> = ({
  input: { balance, name, precision, ticker },
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{name}</CardTitle>
        {/* <CardDescription>{name}</CardDescription> */}
      </CardHeader>
      <CardContent>{`${numberWithPrecision(balance, precision)} ${ticker}`}</CardContent>
      {/* <CardFooter>{ticker}</CardFooter> */}
    </Card>
  );
};

// const Transactions = () => {};

export const WalletInfo: FC<{ id: string }> = ({ id }) => {
  const { data, loading, error } = useGetWalletQuery({ variables: { id } });

  const balances = useMemo(() => {
    if (loading || error) return [];
    if (!data?.wallets.find_one.accounts.length) return [];

    const { accounts } = data.wallets.find_one;

    const mapped: AssetBalance[] = [];

    accounts.forEach(a => {
      a.liquid_assets.forEach(l => {
        mapped.push({
          name: l.asset_info.name,
          ticker: l.asset_info.ticker,
          balance: l.balance,
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
      a.liquid_assets.forEach(l => {
        l.transactions.forEach(t => {
          transactions.push({
            id: t.id,
            tx_id: t.tx_id,
            balance: t.balance,
            date: t.date,
            fee: t.fee,
            ticker: l.asset_info.ticker,
            precision: l.asset_info.precision,
            name: l.asset_info.name,
            unblinded_url: t.unblinded_url,
            blinded_url: t.blinded_url,
          });
        });
      });
    });

    const sorted = sortBy(transactions, t =>
      t.date ? new Date(t.date) : new Date()
    ).reverse();

    return sorted;
  }, [data, loading, error]);

  return (
    <div className="w-full max-w-5xl">
      <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        Accounts
      </h2>
      <div className="flex w-full max-w-5xl gap-4">
        {balances.map((b, index) => (
          <BalanceCard input={b} key={`${b.ticker}${index}`} />
        ))}
      </div>
      <h2 className="scroll-m-20 pb-2 pt-6 text-3xl font-semibold tracking-tight first:mt-0">
        Transactions
      </h2>
      <TransactionTable data={transactions} />
    </div>
  );
};
