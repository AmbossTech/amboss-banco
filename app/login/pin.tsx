import { Link, router, useGlobalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, Text, TextInput } from 'react-native';

import { i18n } from '../../i18n';
import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { handleError } from '../../src/utils/graphql';
import { VerifyPin } from '../../src/graphql/mutations/verifyPin';
import { setItemAsync } from 'expo-secure-store';
import { AUTH_TOKEN_KEY } from '../_layout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSessionStore } from '../../src/stores/SessionStore';

export default function Page() {
  const setAuthToken = useSessionStore(s => s.setAuthToken);

  const [pin, onChangePin] = useState('');
  const { email } = useGlobalSearchParams();

  const [verifyPin, { data, loading }] = useMutation(VerifyPin, {
    onError: err => Alert.alert('Unable to Login', handleError(err)),
  });

  useEffect(() => {
    if (loading) return;
    if (!data?.publicAuth.verifyPin.jwt) return;

    const handleLogin = async () => {
      await setItemAsync(AUTH_TOKEN_KEY, data.publicAuth.verifyPin.jwt);
      setAuthToken(data.publicAuth.verifyPin.jwt);
      router.replace('/');
    };

    handleLogin();
  }, [data, loading]);

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-yellow-300">
      <StatusBar style="light" />

      <Link href="/login" asChild>
        <Pressable className="flex flex-col items-center">
          <Text className="text-xs">Go Back</Text>
        </Pressable>
      </Link>

      <Text>{i18n.t('welcome.title')}</Text>

      <TextInput
        className="m-4 w-full bg-green-50 p-2"
        onChangeText={onChangePin}
        placeholder="PIN"
        value={pin}
      />
      <Pressable
        className="flex flex-col items-center"
        onPress={() => {
          if (!!pin) {
            verifyPin({ variables: { pin, email } });
          }
        }}
      >
        <Text className="text-xs">Login</Text>
      </Pressable>
    </SafeAreaView>
  );
}
