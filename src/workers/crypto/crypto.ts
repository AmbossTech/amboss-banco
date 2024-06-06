import init, * as ecies from 'ecies-wasm';
import {
  Mnemonic,
  Network,
  Pset,
  Signer,
  Wollet,
  WolletDescriptor,
} from 'lwk_wasm';

import { toWithError } from '@/utils/async';
import {
  bufToHex,
  bufToUTF8,
  decryptCipher,
  encryptCipher,
  generateNewMnemonic,
  hexToBuf,
  restoreMnemonic,
} from '@/utils/crypto';

import { CryptoWorkerMessage, CryptoWorkerResponse } from './types';

init();

async function secp256k1GenerateProtectedKeyPair(
  masterKey: string,
  iv: string
) {
  const [privateKey, publicKey] = ecies.generateKeypair();

  const privateKeyHex = bufToHex(privateKey);

  const protectedPrivateKey = await encryptCipher(
    hexToBuf(privateKeyHex),
    masterKey,
    iv
  );

  return {
    publicKey: bufToHex(publicKey),
    protectedPrivateKey: bufToHex(protectedPrivateKey),
  };
}

const eciesEncrypt = (pubkey: string, msg: string) => {
  return ecies.encrypt(hexToBuf(pubkey), Buffer.from(msg));
};

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

      const { publicKey, protectedPrivateKey } =
        await secp256k1GenerateProtectedKeyPair(masterKey, iv);

      const liquidDescriptor = await generateLiquidDescriptor(mnemonic);

      const response: CryptoWorkerResponse = {
        type: 'newWallet',
        payload: {
          protectedMnemonic: bufToHex(protectedMnemonic),
          liquidDescriptor,
          secp256k1_key_pair: {
            public_key: publicKey,
            protected_private_key: protectedPrivateKey,
          },
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

      const { publicKey, protectedPrivateKey } =
        await secp256k1GenerateProtectedKeyPair(masterKey, iv);

      const [liquidDescriptor, error] = await toWithError(
        generateLiquidDescriptor(mnemonic)
      );

      if (error) {
        self.postMessage({ type: 'error', msg: error });
      } else {
        const response: CryptoWorkerResponse = {
          type: 'newWallet',
          payload: {
            protectedMnemonic: bufToHex(protectedMnemonic),
            liquidDescriptor,
            secp256k1_key_pair: {
              public_key: publicKey,
              protected_private_key: protectedPrivateKey,
            },
          },
        };

        self.postMessage(response);
      }

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

    case 'decryptMnemonic': {
      const { protectedMnemonic, masterKey, iv } = message.payload;

      const unprotectedMnemonic = await decryptCipher(
        Buffer.from(protectedMnemonic, 'hex'),
        masterKey,
        iv
      );

      const response: CryptoWorkerResponse = {
        type: 'decryptMnemonic',
        payload: {
          mnemonic: Buffer.from(unprotectedMnemonic).toString('utf-8'),
        },
      };

      self.postMessage(response);

      break;
    }

    case 'eciesEncrypt': {
      const {
        sender_pubkey,
        receiver_pubkey,
        receiver_lightning_address,
        msg,
      } = message.payload;

      const sender_protected_message = eciesEncrypt(sender_pubkey, msg);
      const receiver_protected_message = eciesEncrypt(receiver_pubkey, msg);

      const response: CryptoWorkerResponse = {
        type: 'eciesEncrypt',
        payload: {
          receiver_lightning_address,
          receiver_protected_message: bufToHex(receiver_protected_message),
          sender_protected_message: bufToHex(sender_protected_message),
        },
      };

      self.postMessage(response);

      break;
    }

    case 'decryptMessages': {
      const { iv, masterKey, messages } = message.payload;

      const protectedPrivateKeyPayload = message.payload.protectedPrivateKey;

      const decryptedPrivateKeyPayload = await decryptCipher(
        Buffer.from(protectedPrivateKeyPayload, 'hex'),
        masterKey,
        iv
      );

      const decryptedPrivateKeyPayloadHex = bufToHex(
        decryptedPrivateKeyPayload
      );

      const unprotectedMessages = messages.map(m => {
        try {
          const decrypted = ecies.decrypt(
            hexToBuf(decryptedPrivateKeyPayloadHex),
            hexToBuf(m.protected_message)
          );

          const message = bufToUTF8(decrypted);

          return { ...m, message };
        } catch (error) {
          return { ...m, message: 'Error decrypting message.' };
        }
      });

      const response: CryptoWorkerResponse = {
        type: 'decryptMessages',
        payload: unprotectedMessages,
      };

      self.postMessage(response);

      break;
    }

    default:
      console.log('Unhandled event', { message });
      break;
  }
};

self.postMessage({ type: 'loaded' });
