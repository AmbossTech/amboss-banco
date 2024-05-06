import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { Mnemonic, Network, Signer } from 'lwk_wasm';

const generateNewMnemonic = async () => {
  const mnemonic = generateMnemonic(wordlist);

  return mnemonic;
};

const generateLiquidDescriptor = async (mnemonic: string) => {
  const network = Network.mainnet();

  const signer = new Signer(new Mnemonic(mnemonic), network);
  const wolletDescriptor = signer.wpkhSlip77Descriptor().toString();

  return wolletDescriptor;
};

self.onmessage = async e => {
  switch (e.data.type) {
    case 'new':
      const mnemonic = await generateNewMnemonic();
      const liquidDescriptor = await generateLiquidDescriptor(mnemonic);

      self.postMessage({
        type: 'new',
        payload: { mnemonic, liquidDescriptor },
      });

      break;

    default:
      break;
  }
};
