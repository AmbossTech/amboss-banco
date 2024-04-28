import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';

export default function Page() {
  return (
    <View className="flex-1 items-center justify-center bg-purple-300">
      <Link href="/onboard/wallet/new" asChild>
        <Pressable className="flex flex-col items-center">
          <Text>New Wallet</Text>
        </Pressable>
      </Link>
      <Link href="/onboard/wallet/restore" asChild>
        <Pressable className="flex flex-col items-center">
          <Text>Restore Wallet</Text>
        </Pressable>
      </Link>
      <StatusBar style="light" />
    </View>
  );
}
