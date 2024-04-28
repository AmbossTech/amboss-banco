import { useMemo } from 'react';
import { CompressedEntry } from '../../app/wallet/tabs';
import { useGetWalletAccountsQuery } from '../graphql/queries/__generated__/getWalletAccounts.generated';
import { useWalletStore } from '../stores/WalletStore';
import { groupBy } from 'lodash';
import { liquidAssets } from '../utils/constants';

export const useWalletAccounts = () => {
  const walletId = useWalletStore(s => s.walletId);

  const accountId = useWalletStore(s => s.accountId);
  const assetId = useWalletStore(s => s.assetId);

  const { data, error, loading } = useGetWalletAccountsQuery({
    skip: !walletId,
    variables: { id: walletId || '' },
  });

  const accountAndAsset = useMemo((): CompressedEntry | undefined => {
    if (loading || error) return;
    if (!data?.wallets.find_one) return;

    const { accounts } = data.wallets.find_one;

    const simpleAccount = accounts.find(a => a.id === accountId);

    if (!simpleAccount) return;

    const { liquid_assets, ...rest } = simpleAccount;

    const asset = liquid_assets.find(a => a.id === assetId);

    if (!asset) return;

    return { ...asset, accountInfo: rest };
  }, [data, loading, error]);

  return { loading, error, accountAndAsset };
};
