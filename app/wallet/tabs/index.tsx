import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { GetWalletAccountsQuery } from '../../../src/graphql/queries/__generated__/getWalletAccounts.generated';
import { AccountBalance } from '../../../src/components/Account/Balance';
import { AccountTransactions } from '../../../src/components/Account/Transactions';
import { useWalletAccounts } from '../../../src/hooks/useWalletAccounts';

export type CompressedEntry =
  GetWalletAccountsQuery['wallets']['find_one']['accounts'][0]['liquid_assets'][0] & {
    accountInfo: Omit<
      GetWalletAccountsQuery['wallets']['find_one']['accounts'][0],
      'liquid_assets'
    >;
  };

export default function Page() {
  const { loading, accountAndAsset, error } = useWalletAccounts();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-yellow-300">
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-yellow-300">
        <Text>Error loading wallets...</Text>
      </View>
    );
  }

  if (!accountAndAsset) {
    return (
      <View className="flex-1 items-center justify-center bg-yellow-300">
        <Text>No account selected</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center">
      <AccountBalance account={accountAndAsset} />
      <AccountTransactions account={accountAndAsset} />
      <StatusBar style="light" />
    </View>
  );
}
