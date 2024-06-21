'use client';

import { sortBy } from 'lodash';
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Bitcoin,
  DollarSign,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { FC, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { cryptoToUsd } from '@/utils/fiat';
import { numberWithPrecision } from '@/utils/numbers';
import { ROUTES } from '@/utils/routes';
import { TransactionTable } from '@/views/wallet/TxTable';

type AssetBalance = {
  accountId: string;
  name: string;
  ticker: string;
  balance: string;
  formatted_balance: string;
  precision: number;
  assetId: string;
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
    case 'USDt':
      return <DollarSign className={classname} />;
    case 'LBTC':
      return <Bitcoin className={classname} />;
    default:
      return null;
  }
};

const BalanceCard: FC<{
  walletId: string;
  accountId: string;
  input: AssetBalance;
}> = ({
  walletId,
  accountId,
  input: { balance, name, precision, ticker, assetId, formatted_balance },
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{name}</CardTitle>
        <BalanceIcon ticker={ticker} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatted_balance}</div>
        <p className="text-xs text-muted-foreground">{`${numberWithPrecision(balance, precision)} ${ticker}`}</p>
      </CardContent>
      <CardFooter className="flex w-full gap-2">
        <Button size={'sm'} className="w-full">
          <Link
            href={ROUTES.app.wallet.receive(walletId, accountId)}
            className="flex"
          >
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Receive
          </Link>
        </Button>
        <Button variant="secondary" size={'sm'} className="w-full">
          <Link
            href={ROUTES.app.wallet.send.home(walletId, accountId, assetId)}
            className="flex"
          >
            <ArrowUpToLine className="mr-2 h-4 w-4" />
            Send
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export const WalletInfo: FC<{ id: string }> = ({ id }) => {
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
          assetId: l.asset_id,
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
        Accounts
      </h2>
      <div className="flex w-full flex-col gap-4 md:flex-row">
        {balances.map((b, index) => (
          <BalanceCard
            walletId={id}
            accountId={b.accountId}
            input={b}
            key={`${b.ticker}${index}`}
          />
        ))}
      </div>
      <h2 className="scroll-m-20 pb-2 pt-6 text-xl font-semibold tracking-tight first:mt-0">
        Transactions
      </h2>
      <TransactionTable data={transactions} />
    </div>
  );
};
