import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronRight, X } from 'lucide-react-native';
import { Pressable, SectionList, Text, View } from 'react-native';
import { CompressedEntry } from './tabs';
import { useMemo } from 'react';
import { useGetWalletAccountsQuery } from '../../src/graphql/queries/__generated__/getWalletAccounts.generated';
import { liquidAssets } from '../../src/utils/constants';
import { groupBy } from 'lodash';
import { numberWithPrecision } from '../../src/utils/numbers';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useWalletStore } from '../../src/stores/WalletStore';

export default function Page() {
  const walletId = useWalletStore(s => s.walletId);
  const setAccountAndAsset = useWalletStore(s => s.setAccountAndAsset);

  const insets = useSafeAreaInsets();

  const { data, error, loading } = useGetWalletAccountsQuery({
    skip: !walletId,
    variables: { id: walletId || '' },
  });

  const grouped = useMemo(() => {
    if (loading || error) return [];
    if (!data?.wallets.find_one) return [];

    const { accounts } = data.wallets.find_one;

    if (!accounts.length) return [];

    const compressed: CompressedEntry[] = [];

    accounts.forEach(a => {
      const { liquid_assets, ...rest } = a;
      a.liquid_assets.forEach(asset => {
        compressed.push({ ...asset, accountInfo: rest });
      });
    });

    const grouped = groupBy(compressed, a => a.asset_id);

    const usdtAccounts = grouped[liquidAssets.LIQUID_USDT];
    const lbtcAccounts = grouped[liquidAssets.LIQUID_BITCOIN];

    return [
      {
        title: 'Tether USD',
        data: usdtAccounts,
      },
      {
        title: 'Liquid Bitcoin',
        data: lbtcAccounts,
      },
    ];
  }, [data]);

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-black px-2 pt-20">
      <View
        className="absolute left-0 ml-2 flex items-center pb-8"
        style={{ top: insets.top + 8 }}
      >
        <Link href="/wallet/tabs" asChild>
          <Pressable className="rounded-lg bg-zinc-900 p-2">
            <X color={'white'} />
          </Pressable>
        </Link>
      </View>
      <SectionList
        sections={grouped}
        keyExtractor={(item, index) => item.id + index}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              setAccountAndAsset(item.accountInfo.id, item.id);
              router.push('/wallet/tabs');
            }}
          >
            <View className="mb-4 flex w-full flex-row items-center justify-between rounded-lg bg-zinc-900 p-4">
              <Text className="font-bold text-white">
                {item.accountInfo.name}
              </Text>
              <View className="flex flex-row items-center justify-center gap-4">
                <Text>
                  <Text className="mr-4 text-lg font-bold text-white">
                    {numberWithPrecision(
                      item.balance,
                      item.asset_info.precision
                    )}
                  </Text>{' '}
                  <Text className="font-bold text-white">
                    {item.asset_info.ticker}
                  </Text>
                </Text>
                <ChevronRight size={24} color={'white'} />
              </View>
            </View>
          </Pressable>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View className="mb-2 bg-black pb-4">
            <Text className="font-black text-white">{title}</Text>
          </View>
        )}
      />
      <StatusBar style="light" />
    </SafeAreaView>
  );
}
