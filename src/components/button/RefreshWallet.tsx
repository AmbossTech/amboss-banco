'use client';

import { Loader2, RefreshCcw } from 'lucide-react';
import { FC } from 'react';

import { useRefreshWalletMutation } from '@/graphql/mutations/__generated__/refreshWallet.generated';

import { CommandItem } from '../ui/command';

export const RefreshWallet: FC<{
  title: string;
  walletId: string;
  fullScan: boolean;
}> = ({ walletId, fullScan, title }) => {
  const [refresh, { loading }] = useRefreshWalletMutation({
    variables: { input: { wallet_id: walletId, full_scan: fullScan } },
    refetchQueries: ['getWallet'],
    onError: err => console.log('ERROR', err),
  });

  return (
    <CommandItem onSelect={() => refresh()} className="cursor-pointer">
      {title}
      {loading ? (
        <Loader2 className="ml-auto size-4 animate-spin" />
      ) : (
        <RefreshCcw className="ml-auto size-4" />
      )}
    </CommandItem>
  );
};
