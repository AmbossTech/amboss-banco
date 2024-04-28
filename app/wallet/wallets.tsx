import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronRight, X } from 'lucide-react-native';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useMemo } from 'react';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useWalletStore } from '../../src/stores/WalletStore';
import { useGetWalletsQuery } from '../../src/graphql/queries/__generated__/getWallets.generated';

export default function Page() {
  const setWallet = useWalletStore(s => s.setWallet);

  const insets = useSafeAreaInsets();

  const { data, error, loading } = useGetWalletsQuery();

  const grouped = useMemo(() => {
    if (loading || error) return [];
    if (!data?.wallets.find_many.length) return [];

    const wallets = data.wallets.find_many;

    if (!wallets.length) return [];

    return wallets.map(w => ({ id: w.id, title: w.name }));
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
      <FlatList
        data={grouped}
        keyExtractor={(item, index) => item.id + index}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              setWallet(item.id);
              router.push('/wallet/tabs');
            }}
          >
            <View className="mb-4 flex w-full flex-row items-center justify-between rounded-lg bg-zinc-900 p-4">
              <Text className="font-bold text-white">{item.title}</Text>
              <ChevronRight size={24} color={'white'} />
            </View>
          </Pressable>
        )}
      />
      <StatusBar style="light" />
    </SafeAreaView>
  );
}
