import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, Text, TextInput } from 'react-native';

import { i18n } from '../../i18n';
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { GetEmailPin } from '../../src/graphql/mutations/getEmailPin';
import { handleError } from '../../src/utils/graphql';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Page() {
  const [email, onChangeEmail] = useState('');

  const [getPin] = useMutation(GetEmailPin, {
    onError: err => Alert.alert('Unable to Login', handleError(err)),
    onCompleted: () => router.push(`/login/pin?email=${email}`),
  });

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-yellow-300">
      <StatusBar style="light" />
      <Text>{i18n.t('welcome.title')}</Text>
      <TextInput
        className="m-4 w-full bg-green-50 p-2"
        onChangeText={onChangeEmail}
        placeholder="Email"
        value={email}
        autoCapitalize={'none'}
      />
      <Pressable
        className="flex flex-col items-center"
        onPress={() => {
          if (!!email) {
            getPin({ variables: { email } });
          }
        }}
      >
        <Text className="text-xs">Login</Text>
      </Pressable>
    </SafeAreaView>
  );
}
