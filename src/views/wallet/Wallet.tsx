'use client';

import { sortBy } from 'lodash';
import { ArrowDownToLine, ArrowUpToLine } from 'lucide-react';
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
import { numberWithPrecision } from '@/utils/numbers';
import { ROUTES } from '@/utils/routes';
import { TransactionTable } from '@/views/wallet/TxTable';

type AssetBalance = {
  accountId: string;
  name: string;
  ticker: string;
  balance: string;
  precision: number;
  assetId: string;
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

const BalanceCard: FC<{
  walletId: string;
  accountId: string;
  input: AssetBalance;
}> = ({
  walletId,
  accountId,
  input: { balance, name, precision, ticker, assetId },
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{name}</CardTitle>
        {/* <CardDescription>{name}</CardDescription> */}
      </CardHeader>
      <CardContent>{`${numberWithPrecision(balance, precision)} ${ticker}`}</CardContent>
      <CardFooter className="flex gap-2">
        <Button>
          <Link
            href={ROUTES.app.wallet.receive(walletId, accountId)}
            className="flex"
          >
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Receive
          </Link>
        </Button>
        <Button variant="secondary">
          <Link
            href={ROUTES.app.wallet.send(walletId, accountId, assetId)}
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
      a.liquid_assets.forEach(l => {
        mapped.push({
          accountId: a.id,
          assetId: l.asset_id,
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
          <BalanceCard
            walletId={id}
            accountId={b.accountId}
            input={b}
            key={`${b.ticker}${index}`}
          />
        ))}
      </div>
      <h2 className="scroll-m-20 pb-2 pt-6 text-3xl font-semibold tracking-tight first:mt-0">
        Transactions
      </h2>
      <TransactionTable data={transactions} />
    </div>
  );
};
