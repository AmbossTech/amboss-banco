import { Mnemonic, Network, Signer } from 'lwk_wasm';

import {
  bufToHex,
  bufToUTF8,
  decryptCipher,
  generateNewMnemonic,
  restoreMnemonic,
} from '@/utils/crypto';

import { CryptoWorkerMessage, CryptoWorkerResponse } from './types';

const generateLiquidDescriptor = async (mnemonic: string) => {
  const network = Network.mainnet();

  const signer = new Signer(new Mnemonic(mnemonic), network);
  const wolletDescriptor = signer.wpkhSlip77Descriptor().toString();

  return wolletDescriptor;
};

self.onmessage = async e => {
  const message: CryptoWorkerMessage = e.data;
  switch (message.type) {
    case 'newWallet': {
      const { masterKey, iv } = message.payload;
      const { mnemonic, protectedMnemonic } = await generateNewMnemonic(
        masterKey,
        iv
      );

      const liquidDescriptor = await generateLiquidDescriptor(mnemonic);

      const unprotectedMnemonic = await decryptCipher(
        protectedMnemonic,
        masterKey,
        iv
      );

      console.log({
        mnemonic,
        protectedMnemonic: bufToHex(protectedMnemonic),
        unprotectedMnemonic: bufToUTF8(unprotectedMnemonic),
      });

      const response: CryptoWorkerResponse = {
        type: 'newWallet',
        payload: {
          protectedMnemonic: bufToHex(protectedMnemonic),
          liquidDescriptor,
        },
      };

      self.postMessage(response);

      break;
    }

    case 'restoreWallet': {
      const { masterKey, iv } = message.payload;

      const { mnemonic, protectedMnemonic } = await restoreMnemonic(
        message.payload.mnemonic,
        masterKey,
        iv
      );

      const liquidDescriptor = await generateLiquidDescriptor(mnemonic);

      const response: CryptoWorkerResponse = {
        type: 'newWallet',
        payload: {
          protectedMnemonic: bufToHex(protectedMnemonic),
          liquidDescriptor,
        },
      };

      self.postMessage(response);

      break;
    }

    default:
      break;
  }
};
