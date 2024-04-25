import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

import { i18n } from '../../i18n';
import { useSessionState } from '../../src/context/session';

export default function Page() {
  const { passphrase } = useSessionState();

  return (
    <View className="flex-1 items-center justify-center bg-yellow-300">
      <Text>
        {i18n.t('welcomeTitle')} {i18n.t('name')}
      </Text>
      <Text>{passphrase}</Text>
      <StatusBar style="auto" />
    </View>
  );
}
