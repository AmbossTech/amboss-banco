'use client';

import { Loader2, RefreshCcw } from 'lucide-react';
import { FC } from 'react';

import { useRefreshWalletMutation } from '@/graphql/mutations/__generated__/refreshWallet.generated';

import { CommandItem } from '../ui/command';

export const RefreshWallet: FC<{ walletId: string }> = ({ walletId }) => {
  const [refresh, { loading }] = useRefreshWalletMutation({
    variables: { input: { wallet_id: walletId } },
    refetchQueries: ['getWallet'],
    onError: err => console.log('ERROR', err),
  });

  return (
    <CommandItem onSelect={() => refresh()} className="cursor-pointer">
      Refresh
      {loading ? (
        <Loader2 className="ml-auto size-4 animate-spin" />
      ) : (
        <RefreshCcw className="ml-auto size-4" />
      )}
    </CommandItem>
  );
};
