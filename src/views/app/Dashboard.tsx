'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FC, useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import {
  useGetAllWalletsQuery,
  useGetWalletQuery,
} from '@/graphql/queries/__generated__/wallet.generated';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { ROUTES } from '@/utils/routes';

import { WalletInfo } from '../wallet/Wallet';

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

  return <WalletInfo id={walletId} />;
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
