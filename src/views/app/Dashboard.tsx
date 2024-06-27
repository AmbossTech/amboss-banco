'use client';

import {
  AlertTriangle,
  Copy,
  CopyCheck,
  Handshake,
  Loader2,
  RefreshCcw,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FC, useEffect, useMemo, useState } from 'react';
import { useCopyToClipboard, useLocalStorage } from 'usehooks-ts';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRefreshWalletMutation } from '@/graphql/mutations/__generated__/refreshWallet.generated';
import {
  useGetAllWalletsQuery,
  useGetWalletDetailsQuery,
} from '@/graphql/queries/__generated__/wallet.generated';
import { useWalletInfo } from '@/hooks/wallet';
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

  const addresses = useMemo(() => {
    if (!data?.wallets.find_one.money_address) {
      return [];
    }
    return data.wallets.find_one.money_address;
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
        {!addresses.length ? null : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Money Address
              </CardTitle>
              <Handshake className={'h-4 w-4 text-muted-foreground'} />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                {addresses.map(a => {
                  return (
                    <div key={a.id}>
                      <div className="text-2xl font-bold">{a.user}</div>
                      {a.domains.map(d => {
                        return (
                          <div className="flex gap-1" key={d}>
                            <p className="text-xs text-muted-foreground">
                              {'@' + d}
                            </p>
                            <button onClick={() => copy(`${a.user}@${d}`)}>
                              {copiedText ? (
                                <CopyCheck className="size-3" color={'green'} />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const Warning: FC<{ id: string }> = ({ id }) => {
  const { loading, error, liquidAssets } = useWalletInfo(id);

  const showAlert = useMemo(() => {
    const otherAssets = liquidAssets.filter(
      a => a.asset_info.ticker !== 'BTC' && !!a.balance
    );

    const btcAsset = liquidAssets.filter(
      a => a.asset_info.ticker == 'BTC' && !!a.balance
    );

    return !!otherAssets.length && !btcAsset.length;
  }, [liquidAssets]);

  if (loading || error) return null;
  if (!liquidAssets.length) return null;
  if (!showAlert) return null;

  return (
    <Alert className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Add Bitcoin!</AlertTitle>
      <AlertDescription>
        In order to send USD you need to add Bitcoin to your wallet.
      </AlertDescription>
    </Alert>
  );
};

const Wallet: FC<{ walletId: string }> = ({ walletId }) => {
  const { id, loading } = useWalletInfo(walletId);

  if (loading) {
    return (
      <div className="flex w-full justify-center py-4">
        <Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  if (!id) return null;

  return (
    <>
      <Warning id={walletId} />
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
