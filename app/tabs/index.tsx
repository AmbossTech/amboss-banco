import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

import { i18n } from '../../i18n';
import { useWalletState } from '../../src/context/wallet';
import { useGetWalletAccountsQuery } from '../../src/graphql/queries/__generated__/getWalletAccounts.generated';

export default function Page() {
  const { currentWallet, loading } = useWalletState();

  const {
    data,
    error,
    loading: accountsLoading,
  } = useGetWalletAccountsQuery({
    skip: loading || !currentWallet,
    variables: { findOneId: currentWallet },
  });

  if (loading || accountsLoading) {
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

  const wallets = data?.wallets?.find_one?.accounts[0].liquid_assets || [];

  console.log(JSON.stringify(wallets, null, 2));

  return (
    <View className="flex-1 items-center justify-center bg-yellow-300">
      <Text>
        {i18n.t('welcomeTitle')} {i18n.t('name')}
      </Text>
      {wallets.map((item: any) => (
        <Text key={item.id}>{item.balance}</Text>
      ))}
      {/* <FlatList
        data={data?.wallets?.find_many || []}
        renderItem={({ item }) => <Text>{item.name}</Text>}
      /> */}
      <StatusBar style="auto" />
    </View>
  );
}
