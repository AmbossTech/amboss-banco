import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function Page() {
  return (
    <View className="flex-1 items-center justify-center bg-pink-300">
      <Text>Login</Text>
      <StatusBar style="auto" />
    </View>
  );
}
