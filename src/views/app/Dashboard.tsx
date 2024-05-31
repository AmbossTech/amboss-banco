'use client';

import { CircleEqual, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useLocalStorage } from 'usehooks-ts';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { ROUTES } from '@/utils/routes';

import { WalletInfo } from '../wallet/Wallet';

export const Dashboard = () => {
  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  if (!value) {
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
