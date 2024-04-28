import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';
import { ROUTES, STORAGE_KEYS } from '../../../src/constants';
import { deleteItemAsync } from 'expo-secure-store';

export default function Page() {
  // deleteItemAsync(STORAGE_KEYS.userAuthPin);

  return (
    <View className="flex-1 items-center justify-center bg-purple-300">
      <Link href={ROUTES.onboard.wallet.new} asChild>
        <Pressable className="flex flex-col items-center">
          <Text>New Wallet</Text>
        </Pressable>
      </Link>
      <Link href={ROUTES.onboard.wallet.restore} asChild>
        <Pressable className="flex flex-col items-center">
          <Text>Restore Wallet</Text>
        </Pressable>
      </Link>
      <StatusBar style="light" />
    </View>
  );
}
