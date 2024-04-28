import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreatePin } from '../../src/components/CreatePin';
import { useState } from 'react';
import { Text } from 'react-native';
import { getItemAsync, setItemAsync } from 'expo-secure-store';
import { ROUTES, STORAGE_KEYS } from '../../src/constants';
import { router } from 'expo-router';
import { hasHardwareAsync, isEnrolledAsync } from 'expo-local-authentication';

export default function Page() {
  const [loading, setLoading] = useState(false);

  const handlePinCreated = async (pin: string) => {
    setLoading(true);

    await setItemAsync(STORAGE_KEYS.userAuthPin, pin);

    const biometricsEnabled = await getItemAsync(
      STORAGE_KEYS.userEnabledBiometrics
    );

    if (!!biometricsEnabled) {
      router.replace(ROUTES.home);
    }

    const compatible = await hasHardwareAsync();

    console.log({ compatible });

    if (!compatible) {
      router.replace(ROUTES.home);
    }

    const savedBiometrics = await isEnrolledAsync();

    console.log({ savedBiometrics });

    if (!savedBiometrics) {
      router.replace(ROUTES.home);
    }

    router.replace(ROUTES.login.setBiometric);

    setLoading(false);
  };

  if (!loading) {
    <SafeAreaView className="flex-1 items-center justify-center bg-yellow-300">
      <StatusBar style="light" />
      <Text>Loading...</Text>
    </SafeAreaView>;
  }

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-yellow-300">
      <StatusBar style="light" />
      <CreatePin callback={handlePinCreated} />
    </SafeAreaView>
  );
}
