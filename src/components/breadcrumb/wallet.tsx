'use client';

import { Circle } from 'lucide-react';
import Link from 'next/link';
import { FC, useMemo } from 'react';

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGetAllWalletsQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { ROUTES } from '@/utils/routes';

export const SingleWalletBreadcrumb: FC<{
  id: string;
  currentTitle: string;
}> = ({ id, currentTitle }) => {
  const { data, error, loading } = useGetAllWalletsQuery();

  const currentWalletName = useMemo(() => {
    const current = data?.wallets.find_many.find(w => w.id === id);
    return current?.name || 'Wallet';
  }, [data, id]);

  const wallets = data?.wallets.find_many || [];

  return (
    <Breadcrumb className="flex h-12 w-full max-w-5xl items-center">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={ROUTES.app.home}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href={ROUTES.app.wallet.home}>Wallets</BreadcrumbLink>
        </BreadcrumbItem>
        {error || (wallets.length < 2 && !loading) ? null : (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1">
                  <BreadcrumbEllipsis className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {wallets.map(w => (
                    <DropdownMenuItem key={w.id}>
                      <Link
                        href={ROUTES.app.wallet.id(w.id)}
                        className="flex w-full items-center justify-between"
                      >
                        {w.name}
                        {id === w.id ? (
                          <Circle
                            className="h-2 w-2"
                            color={'green'}
                            fill="green"
                          />
                        ) : null}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
          </>
        )}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href={ROUTES.app.wallet.id(id)}>
            {currentWalletName}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{currentTitle}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};