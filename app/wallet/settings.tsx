import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function Page() {
  return (
    <View className="flex-1 items-center justify-center bg-purple-300">
      <Text>This is the about page.</Text>
      <StatusBar style="auto" />
    </View>
  );
}
