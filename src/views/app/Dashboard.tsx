'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { ROUTES } from '@/utils/routes';

import { WalletInfo } from '../wallet/Wallet';

export const Dashboard = () => {
  const { push } = useRouter();

  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const { data, loading } = useGetWalletQuery({
    variables: { id: value },
    skip: !value,
    errorPolicy: 'ignore',
  });

  useEffect(() => {
    if (!value) return;
    if (loading) return;
    if (!!data?.wallets.find_one.id) return;
    localStorage.removeItem(LOCALSTORAGE_KEYS.currentWalletId);
  }, [data, loading, value]);

  useEffect(() => {
    if (value) return;
    if (loading) return;
    if (!!data?.wallets.find_one.id) return;
    push(ROUTES.setup.wallet.home);
  }, [value, data, push, loading]);

  if (loading) {
    return (
      <div className="flex w-full justify-center py-4">
        <Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  if (!value || !data?.wallets.find_one.id) {
    return null;
  }

  return (
    <div className="py-4">
      <WalletInfo id={value} />
    </div>
  );
};
