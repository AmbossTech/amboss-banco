'use client';

import { RefreshCw, RotateCw } from 'lucide-react';
import { FC } from 'react';

import { useRefreshWalletMutation } from '@/graphql/mutations/__generated__/refreshWallet.generated';
import { cn } from '@/utils/cn';

import { DropdownMenuItem } from '../ui/dropdown-menu';
import { useToast } from '../ui/use-toast';

export const RefreshWallet: FC<{
  title: string;
  walletId: string;
  fullScan: boolean;
}> = ({ walletId, fullScan, title }) => {
  const { toast } = useToast();

  const [refresh, { loading }] = useRefreshWalletMutation({
    variables: { input: { wallet_id: walletId, full_scan: fullScan } },
    refetchQueries: ['getWallet'],
    onError: () =>
      toast({
        variant: 'destructive',
        title: 'Error refeshing wallet.',
      }),
  });

  return (
    <DropdownMenuItem
      onClick={e => {
        e.preventDefault();
        refresh();
      }}
    >
      {fullScan ? (
        <RefreshCw
          size={16}
          className={cn('mr-3', loading && 'animate-spin')}
        />
      ) : (
        <RotateCw size={16} className={cn('mr-3', loading && 'animate-spin')} />
      )}
      {title}
    </DropdownMenuItem>
  );
};
