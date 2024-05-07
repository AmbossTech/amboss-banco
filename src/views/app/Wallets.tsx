'use client';

import { ChevronRight, Wallet } from 'lucide-react';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAllWalletsQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { ROUTES } from '@/utils/routes';

export const UserWallets = () => {
  const { data, loading, error } = useGetAllWalletsQuery();

  const wallets = data?.wallets.find_many || [];

  if (error) {
    return (
      <Card className="my-10 w-full max-w-5xl">
        <CardHeader>
          <CardTitle className="text-lg">Wallets</CardTitle>
          <CardDescription>Error loading wallets.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="my-10 w-full max-w-5xl">
      <CardHeader>
        <CardTitle className="text-lg">Wallets</CardTitle>
        <CardDescription>{`You have ${data?.wallets.find_many.length || '-'} wallets.`}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col">
        {loading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          wallets.map(w => (
            <Link
              key={w.id}
              href={ROUTES.app.wallet.id(w.id)}
              className="my-2 rounded-lg border border-slate-200 p-2 hover:border-slate-400"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Wallet className="mr-2 h-4 w-4" />
                  {w.name}
                </div>
                <ChevronRight className="mr-2 h-4 w-4" />
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
};
