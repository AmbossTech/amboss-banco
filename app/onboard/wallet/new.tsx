// import { entropyToMnemonic, mnemonicToSeed } from 'bip39';
import { getRandomBytes } from 'expo-crypto';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';
// import ecc from '@bitcoinerlab/secp256k1';
// import * as ecc from 'react-native-fast-crypto';
// import { SLIP77Factory } from 'slip77';

// const slip77 = SLIP77Factory(ecc);

export default function Page() {
  const create = async () => {
    // const bytes = getRandomBytes(16);
    // const mnemonic = entropyToMnemonic(bytes, wordlist);

    const mnemonic = '';

    // const seed = await mnemonicToSeed(mnemonic);
    // const masterBlindingKey = slip77.fromSeed(seed).masterKey.toString('hex');

    // console.log(JSON.stringify({ mnemonic, masterBlindingKey }, null, 2));
    // console.log(wolletDescriptor);
  };

  return (
    <View className="flex-1 items-center justify-center bg-purple-300">
      <Text>New Wallet</Text>

      <Pressable className="flex flex-col items-center" onPress={create}>
        <Text>Create</Text>
      </Pressable>

      <StatusBar style="light" />
    </View>
  );
}
