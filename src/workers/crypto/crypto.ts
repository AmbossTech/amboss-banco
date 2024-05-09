import {
  Mnemonic,
  Network,
  Pset,
  Signer,
  Wollet,
  WolletDescriptor,
} from 'lwk_wasm';

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

const signPset = (mnemonic: string, descriptor: string, pset: string) => {
  const network = Network.mainnet();

  const signer = new Signer(new Mnemonic(mnemonic), network);

  const psetFromBase64 = new Pset(pset);
  const signedPset = signer.sign(psetFromBase64);

  const wolletDescriptor = new WolletDescriptor(descriptor);

  const wollet = new Wollet(network, wolletDescriptor);

  const finalizedPset = wollet.finalize(signedPset);

  return finalizedPset.toString();
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

    case 'signPset': {
      const { descriptor, masterKey, iv, pset } = message.payload;

      const unprotectedMnemonic = await decryptCipher(
        Buffer.from(message.payload.mnemonic, 'hex'),
        masterKey,
        iv
      );

      const signedPset = signPset(
        Buffer.from(unprotectedMnemonic).toString('utf-8'),
        descriptor,
        pset
      );

      const response: CryptoWorkerResponse = {
        type: 'signPset',
        payload: {
          signedPset,
        },
      };

      self.postMessage(response);

      break;
    }

    default:
      break;
  }
};
