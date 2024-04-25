import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, Text } from 'react-native';

import { i18n } from '../../i18n';

export default function Page() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-yellow-300">
      <Text>{i18n.t('welcome.title')}</Text>
      <StatusBar style="auto" />
      <Link href="/onboard/wallet" asChild>
        <Pressable className="flex flex-col items-center">
          <Text className="text-xs text-white">Get Started</Text>
        </Pressable>
      </Link>
    </SafeAreaView>
  );
}
