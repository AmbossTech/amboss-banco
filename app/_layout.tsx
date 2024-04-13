import { Slot, Link } from 'expo-router';
import { Home, Settings } from 'lucide-react-native';
import { Text, Pressable, View } from 'react-native';

export default function HomeLayout() {
  return (
    <>
      <Slot />
      <View className="flex flex-row items-center justify-around bg-black py-4">
        <Link href="/" asChild>
          <Pressable className="flex flex-col items-center">
            <Home color="white" size={18} />
            <Text className="text-xs text-white">Home</Text>
          </Pressable>
        </Link>
        <Link href="/settings" asChild>
          <Pressable className="flex flex-col items-center">
            <Settings color="white" size={18} />
            <Text className="text-xs text-white">Settings</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}
