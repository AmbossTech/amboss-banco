import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text } from 'react-native';

import { i18n } from '../i18n';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSessionStore } from '../src/stores/SessionStore';

export default function Page() {
  const authToken = useSessionStore(state => state.authToken);

  useEffect(() => {
    setTimeout(() => {
      if (!!authToken) {
        router.replace('/wallet/tabs');
      } else {
        router.replace('/login');
      }
    }, 0);
  }, [authToken]);

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-blue-300">
      <Text>{i18n.t('welcome.title')}</Text>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}
