import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function Page() {
  return (
    <View className="flex-1 items-center justify-center bg-purple-300">
      <Text>Restore Wallet</Text>
      <StatusBar style="light" />
    </View>
  );
}
