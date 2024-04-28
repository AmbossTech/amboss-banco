import { Slot, router } from 'expo-router';
import { useGetWalletsQuery } from '../../src/graphql/queries/__generated__/getWallets.generated';
import { useEffect } from 'react';
import { useWalletStore } from '../../src/stores/WalletStore';
import { useGetWalletAccountsLazyQuery } from '../../src/graphql/queries/__generated__/getWalletAccounts.generated';
import { ROUTES } from '../../src/constants';

export default function HomeLayout() {
  const { data, loading, error } = useGetWalletsQuery();
  const [
    getWallet,
    { data: walletData, loading: walletLoading, error: walletError },
  ] = useGetWalletAccountsLazyQuery();

  const setWallet = useWalletStore(s => s.setWallet);
  const setAccountAndAsset = useWalletStore(s => s.setAccountAndAsset);

  useEffect(() => {
    if (loading || error) return;

    if (!data?.wallets?.find_many?.length) {
      router.replace(ROUTES.onboard.wallet.main);
      return;
    }

    const firstWallet = data.wallets.find_many[0];

    setWallet(firstWallet.id);

    if (!firstWallet.accounts.length) return;

    getWallet({ variables: { id: firstWallet.id } });
  }, [data]);

  useEffect(() => {
    if (walletLoading || walletError) return;
    if (!walletData?.wallets.find_one.accounts.length) return;

    const { id, liquid_assets } = walletData.wallets.find_one.accounts[0];

    if (!liquid_assets.length) return;

    setAccountAndAsset(id, liquid_assets[0].id);
  }, [walletData]);

  return <Slot />;
}
