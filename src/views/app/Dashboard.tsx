'use client';

import { CircleEqual, Loader2, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { ROUTES } from '@/utils/routes';

import { WalletInfo } from '../wallet/Wallet';

export const Dashboard = () => {
  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');
  const { data, loading } = useGetWalletQuery({
    variables: { id: value },
    errorPolicy: 'ignore',
  });

  useEffect(() => {
    if (!value) return;
    if (loading) return;
    if (!!data?.wallets.find_one.id) return;
    localStorage.removeItem(LOCALSTORAGE_KEYS.currentWalletId);
  }, [data, loading, value]);

  if (loading) {
    return (
      <div className="flex w-full justify-center py-4">
        <Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  if (!value || !data?.wallets.find_one.id) {
    return (
      <div className="flex justify-center py-4">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Banco.</CardTitle>

            <CardDescription>
              Setup your first wallet to start your journey.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-2">
              <Button asChild size={'sm'} className="w-full">
                <Link href={ROUTES.app.wallet.new}>
                  <PlusCircle className="mr-1 size-4" />
                  New Wallet
                </Link>
              </Button>
              <Button
                variant="secondary"
                asChild
                size={'sm'}
                className="w-full"
              >
                <Link href={ROUTES.app.wallet.restore}>
                  <CircleEqual className="mr-1 size-4" />
                  Restore Wallet
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-4">
      <WalletInfo id={value} />
    </div>
  );
};
