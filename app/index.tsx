import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text } from 'react-native';

import { i18n } from '../i18n';
import { useSessionState } from '../src/context/session';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Page() {
  const { accountCreated } = useSessionState();

  useEffect(() => {
    setTimeout(() => {
      if (accountCreated) {
        router.replace('/tabs');
      } else {
        router.replace('/login');
      }
    }, 0);
  }, [accountCreated]);

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-blue-300">
      <Text>{i18n.t('welcome.title')}</Text>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
