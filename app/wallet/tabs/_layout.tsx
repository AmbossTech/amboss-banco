import { Slot, Link } from 'expo-router';
import { Home, Settings, User, Wallet } from 'lucide-react-native';
import { Text, Pressable, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }} className="bg-black">
      <LinearGradient
        colors={['#7928CA70', '#FF008010']}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        }}
      />
      <View
        className="absolute top-0 z-50 flex w-full flex-row justify-between p-4"
        style={{ marginTop: insets.top }}
      >
        <User color={'white'} />
        <Link href="/wallet/wallets" asChild>
          <Pressable className="flex flex-col items-center">
            <Wallet color={'white'} />
          </Pressable>
        </Link>
      </View>

      <ScrollView>
        <Slot />
      </ScrollView>

      <View className="flex flex-row items-center justify-around bg-black py-4">
        <Link href="/wallet/tabs" asChild>
          <Pressable className="flex flex-col items-center">
            <Home color="white" size={18} />
            <Text className="text-xs text-white">Home</Text>
          </Pressable>
        </Link>
        <Link href="/wallet/tabs/settings" asChild>
          <Pressable className="flex flex-col items-center">
            <Settings color="white" size={18} />
            <Text className="text-xs text-white">Settings</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
