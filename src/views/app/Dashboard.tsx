'use client';

import { Copy, Handshake, Loader2, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FC, useEffect, useMemo, useState } from 'react';
import { useCopyToClipboard, useLocalStorage } from 'usehooks-ts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRefreshWalletMutation } from '@/graphql/mutations/__generated__/refreshWallet.generated';
import {
  useGetAllWalletsQuery,
  useGetWalletDetailsQuery,
  useGetWalletQuery,
} from '@/graphql/queries/__generated__/wallet.generated';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { ROUTES } from '@/utils/routes';

import { WalletInfo } from '../wallet/Wallet';

const WalletDetails: FC<{ id: string }> = ({ id }) => {
  const { data } = useGetWalletDetailsQuery({
    variables: { id },
  });

  const [refresh, { loading }] = useRefreshWalletMutation({
    variables: { input: { wallet_id: id } },
    refetchQueries: ['getWallet'],
    onError: err => console.log('ERROR', err),
  });

  const address = useMemo(() => {
    if (!data?.wallets.find_one.money_address) {
      return null;
    }

    const [user, domain] = data.wallets.find_one.money_address.split('@');

    return { user, domain, full: data.wallets.find_one.money_address };
  }, [data]);

  const [copiedText, copy] = useCopyToClipboard();

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between pb-4 md:pb-2">
        <h2 className="scroll-m-20 text-xl font-semibold tracking-tight">
          Wallet
        </h2>
        <div className="flex gap-2">
          <Button
            variant={'outline'}
            size={'sm'}
            className="flex gap-2"
            onClick={() => refresh()}
          >
            Refresh
            {loading ? (
              <Loader2 className="ml-auto size-3 animate-spin" />
            ) : (
              <RefreshCcw className="ml-auto size-3" />
            )}
          </Button>
          <Button asChild variant={'outline'} size={'sm'}>
            <Link href={ROUTES.app.wallet.settings(id)}>Settings</Link>
          </Button>
        </div>
      </div>
      <div className="md:flex">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Money Address</CardTitle>
            <Handshake className={'h-4 w-4 text-muted-foreground'} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2">
              {!!address ? (
                <>
                  <div>
                    <div className="text-2xl font-bold">{address.user}</div>
                    <p className="text-xs text-muted-foreground">
                      {'@' + address.domain}
                    </p>
                  </div>

                  <Button
                    variant={'ghost'}
                    size={'icon'}
                    onClick={() => copy(address.full)}
                  >
                    <Copy
                      className="size-4"
                      color={copiedText ? 'green' : undefined}
                    />
                  </Button>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Wallet: FC<{ walletId: string }> = ({ walletId }) => {
  const { data, loading } = useGetWalletQuery({
    variables: { id: walletId },
    errorPolicy: 'ignore',
  });

  if (loading) {
    return (
      <div className="flex w-full justify-center py-4">
        <Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  if (!data?.wallets.find_one.id) {
    return null;
  }

  return (
    <>
      <WalletDetails id={walletId} />
      <WalletInfo id={walletId} />
    </>
  );
};

export const Dashboard = () => {
  const { push } = useRouter();

  const [checkingId, setCheckingId] = useState<boolean>(true);

  const [value, setValue] = useLocalStorage(
    LOCALSTORAGE_KEYS.currentWalletId,
    ''
  );

  const { data, loading, error } = useGetAllWalletsQuery();

  useEffect(() => {
    if (loading) return;
    if (error) return;

    // User has no wallets for his account
    if (!data?.wallets.find_many.length) {
      localStorage.removeItem(LOCALSTORAGE_KEYS.currentWalletId);
      push(ROUTES.setup.wallet.home);
      return;
    }

    const savedWallets = data.wallets.find_many;

    if (value) {
      const wallet = savedWallets.find(w => w.id === value);

      // User has a valid wallet id in localstorage
      if (!!wallet) {
        setCheckingId(false);
        return;
      }
    }

    setValue(savedWallets[0].id);
    setCheckingId(false);
  }, [data, loading, error, value, push, setValue]);

  if (loading || checkingId) {
    return (
      <div className="flex w-full justify-center py-4">
        <Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-4">
      <Wallet walletId={value} />
    </div>
  );
};
