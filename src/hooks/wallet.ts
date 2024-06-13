import { useLocalStorage } from 'usehooks-ts';

import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';

export const useWalletInfo = () => {
  const [walletId] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const { data, loading } = useGetWalletQuery({
    variables: { id: walletId },
    skip: !walletId,
    errorPolicy: 'ignore',
  });

  if (loading || !data?.wallets.find_one) {
    return {
      id: walletId,
      loading,
    };
  }

  return {
    id: walletId,
    loading,
    protected_mnemonic: data.wallets.find_one.details.protected_mnemonic,
  };
};
