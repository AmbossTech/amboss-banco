import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

import { i18n } from './i18n';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text>Open up App.tsx to start working on your app!</Text>
      <Text>
        {i18n.t('welcome')} {i18n.t('name')}
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}
