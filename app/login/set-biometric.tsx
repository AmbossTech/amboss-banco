import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, Text } from 'react-native';
import { Link, router } from 'expo-router';
import { ROUTES, STORAGE_KEYS } from '../../src/constants';
import { authenticateAsync } from 'expo-local-authentication';
import { setItemAsync } from 'expo-secure-store';

export default function Page() {
  const handleBiometricAuth = async () => {
    console.log('Enabling biometrics...');

    const biometricAuth = await authenticateAsync({
      promptMessage: 'Login with Biometrics',
      disableDeviceFallback: true,
    });

    if (biometricAuth.success) {
      await setItemAsync(STORAGE_KEYS.userEnabledBiometrics, 'true');
    }

    router.replace(ROUTES.home);
  };

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-yellow-300">
      <StatusBar style="light" />
      <Text>Do you want to login with biometrics?</Text>
      <Pressable onPress={handleBiometricAuth}>
        <Text>Enable</Text>
      </Pressable>
      <Link href={ROUTES.home} asChild>
        <Pressable className="flex flex-col items-center">
          <Text>Skip</Text>
        </Pressable>
      </Link>
    </SafeAreaView>
  );
}
