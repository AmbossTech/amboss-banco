import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text } from 'react-native';

import { i18n } from '../i18n';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSessionStore } from '../src/stores/SessionStore';
import { ROUTES, STORAGE_KEYS } from '../src/constants';
import { getItemAsync } from 'expo-secure-store';

export default function Page() {
  const authToken = useSessionStore(state => state.authToken);

  useEffect(() => {
    const run = async () => {
      if (!!authToken) {
        const savedPin = await getItemAsync(STORAGE_KEYS.userAuthPin);
        if (!savedPin) {
          router.replace(ROUTES.login.setPin);
        } else {
          router.replace(ROUTES.wallet.tabs);
        }
      } else {
        router.replace(ROUTES.login.main);
      }
    };

    setTimeout(() => run(), 0);
  }, [authToken]);

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-blue-300">
      <Text>{i18n.t('welcome.title')}</Text>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}
