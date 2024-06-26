import { useCallback, useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { WalletAccountType } from '@/graphql/types';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';

export const useWalletInfo = (id?: string) => {
  const [walletId] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const finalId = id || walletId;

  const { data, loading, error } = useGetWalletQuery({
    variables: { id: finalId },
    skip: !finalId,
    errorPolicy: 'ignore',
  });

  const liquidAssets = useMemo(() => {
    if (!data?.wallets.find_one.accounts.length) {
      return [];
    }

    const liquidAccount = data.wallets.find_one.accounts.find(
      a => a.account_type === WalletAccountType.Liquid
    );

    return liquidAccount?.liquid?.assets || [];
  }, [data]);

  const getLiquidAssetById = useCallback(
    (assetId: string) => {
      if (!assetId) return null;
      if (!data?.wallets.find_one.accounts.length) return null;

      const liquidAccount = data.wallets.find_one.accounts.find(
        a => a.account_type === WalletAccountType.Liquid
      );

      if (!liquidAccount?.liquid) return null;

      const foundAsset = liquidAccount.liquid.assets.find(
        a => a.asset_id === assetId
      );

      return foundAsset;
    },
    [data]
  );

  const getLiquidAssetByCode = useCallback(
    (assetCode: string) => {
      if (!assetCode) return null;
      if (!data?.wallets.find_one.accounts.length) return null;

      const liquidAccount = data.wallets.find_one.accounts.find(
        a => a.account_type === WalletAccountType.Liquid
      );

      if (!liquidAccount?.liquid) return null;

      const foundAsset = liquidAccount.liquid.assets.find(
        a => a.asset_info.ticker === assetCode
      );

      return foundAsset;
    },
    [data]
  );

  return {
    id: finalId,
    data,
    loading,
    error,
    protected_mnemonic: data?.wallets.find_one.details.protected_mnemonic,
    liquidAssets,
    getLiquidAssetById,
    getLiquidAssetByCode,
  };
};
