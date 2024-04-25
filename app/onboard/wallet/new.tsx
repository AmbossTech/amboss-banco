import { entropyToMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { getRandomBytes } from 'expo-crypto';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CreatePin } from '../../../src/components/CreatePin';
import { useSessionDispatch } from '../../../src/context/session';

export default function Page() {
  const dispatch = useSessionDispatch();
  const [showPin, setShowPin] = useState(false);

  const create = () => {
    setShowPin(true);
    // const bytes = getRandomBytes(16);
    // const mn = entropyToMnemonic(bytes, wordlist);
    // console.log(mn);

    // dispatch({ type: 'setPassphrase', passphrase: mn });
    // router.push('/tabs');
  };

  if (showPin) return <CreatePin />;

  return (
    <View className="flex-1 items-center justify-center bg-purple-300">
      <Text>New Wallet</Text>

      <Pressable className="flex flex-col items-center" onPress={create}>
        <Text>Create</Text>
      </Pressable>

      <StatusBar style="auto" />
    </View>
  );
}
