import { Slot, Link } from 'expo-router';
import { Home, Settings, User, Wallet } from 'lucide-react-native';
import { Text, Pressable, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WalletProvider } from '../../src/context/wallet';

export default function HomeLayout() {
  const insets = useSafeAreaInsets();

  return (
    <WalletProvider>
      <View style={{ flex: 1 }} className="bg-purple-100">
        <View
          className="absolute top-0 z-50 flex w-full flex-row justify-between p-4"
          style={{ marginTop: insets.top }}
        >
          <User />
          <Wallet />
        </View>

        <ScrollView style={{ marginTop: insets.top, paddingTop: 60 }}>
          <Slot />
        </ScrollView>

        <View className="flex flex-row items-center justify-around bg-black py-4">
          <Link href="/tabs" asChild>
            <Pressable className="flex flex-col items-center">
              <Home color="white" size={18} />
              <Text className="text-xs text-white">Home</Text>
            </Pressable>
          </Link>
          <Link href="/tabs/settings" asChild>
            <Pressable className="flex flex-col items-center">
              <Settings color="white" size={18} />
              <Text className="text-xs text-white">Settings</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </WalletProvider>
  );
}
