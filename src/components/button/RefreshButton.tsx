import { RefreshCw } from 'lucide-react';
import { FC } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { useRefreshWalletMutation } from '@/graphql/mutations/__generated__/refreshWallet.generated';
import { cn } from '@/utils/cn';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';

import { IconButton } from '../ui/button-v2';
import { useToast } from '../ui/use-toast';

export const RefreshButton: FC<{ className?: string }> = ({ className }) => {
  const { toast } = useToast();

  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const [refresh, { loading: refreshLoading }] = useRefreshWalletMutation({
    variables: { input: { wallet_id: value } },
    refetchQueries: ['getWallet'],
    onCompleted: () => toast({ title: 'Wallet Refreshed!' }),
    onError: () =>
      toast({
        variant: 'destructive',
        title: 'Error refeshing wallet.',
      }),
  });

  return (
    <IconButton
      icon={
        <RefreshCw size={20} className={cn(refreshLoading && 'animate-spin')} />
      }
      onClick={() => refresh()}
      disabled={refreshLoading || !value}
      className={className}
    />
  );
};
