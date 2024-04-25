import { entropyToMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { getRandomBytes } from 'expo-crypto';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, Text, View } from 'react-native';

import DialpadKeypad from './Dialpad/Keypad';
import DialpadPin from './Dialpad/Pin';
import { useSessionDispatch } from '../context/session';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

const dialPadContent = [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'X'];

const dialPadSize = width * 0.2;
const dialPadTextSize = dialPadSize * 0.4;

const pinLength = 6;
const pinContainerSize = width / 2;
const pinSize = pinContainerSize / pinLength;

export const CreatePin = () => {
  const [loading, setLoading] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [code, setCode] = useState<number[]>([]);
  const [repeatCode, setRepeatCode] = useState<number[]>([]);

  const actions = useSessionDispatch();

  const handleCreate = async () => {
    setLoading(true);
    console.log('Creating...');

    console.log(code);
    console.log(repeatCode);

    if (code.join('') !== repeatCode.join('')) {
      Alert.alert('Wrong PIN', 'The PIN was not identical to the first PIN');
      setCode([]);
      setRepeatCode([]);
      setShowRepeat(false);
    } else {
      const bytes = getRandomBytes(16);
      const mnemonic = entropyToMnemonic(bytes, wordlist);

      await actions.setMnemonic(mnemonic, code);

      setCode([]);
      setRepeatCode([]);
      setShowRepeat(false);

      router.replace('/wallet');
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <View
        className="items-center justify-center bg-red-400"
        style={{ height }}
      >
        <Text>Creating new wallet...</Text>
      </View>
    );
  }

  if (showRepeat) {
    return (
      <View
        className="items-center justify-center bg-red-400"
        style={{ height }}
      >
        <Text>Repeat PIN</Text>

        <DialpadPin
          pinLength={pinLength}
          pinSize={pinSize}
          code={repeatCode}
          dialPadContent={dialPadContent}
        />

        <DialpadKeypad
          dialPadContent={dialPadContent}
          pinLength={pinLength}
          setCode={setRepeatCode}
          code={repeatCode}
          dialPadSize={dialPadSize}
          dialPadTextSize={dialPadTextSize}
          callback={handleCreate}
        />
        <Text>{repeatCode.join(', ')}</Text>
      </View>
    );
  }

  return (
    <View className="items-center justify-center bg-red-400" style={{ height }}>
      <Text>Create PIN</Text>
      <Text>Enter your secure six-digit code</Text>

      <DialpadPin
        pinLength={pinLength}
        pinSize={pinSize}
        code={code}
        dialPadContent={dialPadContent}
      />

      <DialpadKeypad
        dialPadContent={dialPadContent}
        pinLength={pinLength}
        setCode={setCode}
        code={code}
        dialPadSize={dialPadSize}
        dialPadTextSize={dialPadTextSize}
        callback={() => setShowRepeat(true)}
      />
      <Text>{code.join(', ')}</Text>
    </View>
  );
};
