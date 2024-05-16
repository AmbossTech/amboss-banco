'use client';

import { ChevronRight, CircleEqual, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { FC } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { useGetAllWalletsQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { ROUTES } from '@/utils/routes';

const WalletHeader: FC<{ description: string }> = ({ description }) => {
  return (
    <div>
      <div className="flex w-full justify-between">
        <h1 className="text-xl font-semibold">Wallets</h1>

        <div className="flex items-center justify-center gap-4">
          <Button asChild size={'sm'}>
            <Link href={ROUTES.app.wallet.new}>
              <PlusCircle className="mr-1 size-4" />
              New Wallet
            </Link>
          </Button>
          <Button variant="secondary" asChild size={'sm'}>
            <Link href={ROUTES.app.wallet.restore}>
              <CircleEqual className="mr-1 size-4" />
              Restore Wallet
            </Link>
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export const UserWallets = () => {
  const { data, error } = useGetAllWalletsQuery();

  const wallets = data?.wallets.find_many || [];

  if (error) {
    return (
      <div className="py-4">
        <WalletHeader description="Error loading wallets." />
      </div>
    );
  }

  return (
    <div className="py-4">
      <WalletHeader
        description={
          data?.wallets.find_many.length
            ? `You have ${data.wallets.find_many.length || '-'} wallets.`
            : 'Create your first wallet to see it here!'
        }
      />
      <div className="mt-4 flex gap-4">
        {wallets.map(w => {
          return (
            <Card key={w.id}>
              <div className="flex flex-row gap-4 p-6">
                <div>
                  <CardTitle>{w.name}</CardTitle>
                  <CardDescription>{`${w.accounts.length} account${w.accounts.length > 1 ? 's' : ''}`}</CardDescription>
                </div>
                <Button variant={'outline'} size={'icon'}>
                  <Link href={ROUTES.app.wallet.id(w.id)}>
                    <ChevronRight className="size-5" />
                  </Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
