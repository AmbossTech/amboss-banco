'use client';

import { Loader2, RefreshCcw } from 'lucide-react';
import { FC } from 'react';

import { Button } from '@/components/ui/button';
import { useRefreshWalletMutation } from '@/graphql/mutations/__generated__/refreshWallet.generated';

export const RefreshWallet: FC<{ walletId: string }> = ({ walletId }) => {
  const [refresh, { loading }] = useRefreshWalletMutation({
    variables: { input: { wallet_id: walletId } },
    refetchQueries: ['getWallet'],
    onError: err => console.log('ERROR', err),
  });

  return (
    <Button onClick={() => refresh()} disabled={loading} variant="outline">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCcw className="h-4 w-4" />
      )}
    </Button>
  );
};
