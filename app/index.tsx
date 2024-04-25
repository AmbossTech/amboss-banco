import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { i18n } from '../i18n';
import { useSessionState } from '../src/context/session';

export default function Page() {
  const { accountCreated } = useSessionState();

  useEffect(() => {
    setTimeout(() => {
      if (accountCreated) {
        router.replace('/login');
      } else {
        router.replace('/onboard');
      }
    }, 0);
  }, [accountCreated]);

  return (
    <View className="flex-1 items-center justify-center bg-blue-300">
      <Text>{i18n.t('welcome.title')}</Text>
      <StatusBar style="auto" />
    </View>
  );
}
