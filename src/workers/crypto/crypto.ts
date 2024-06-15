import { hexToBytes } from '@noble/hashes/utils';
import { getPublicKey } from '@noble/secp256k1';
import {
  Mnemonic,
  Network,
  Pset,
  Signer,
  Wollet,
  WolletDescriptor,
} from 'lwk_wasm';
import { nip44 } from 'nostr-tools';

import { toWithError } from '@/utils/async';
import {
  bufToHex,
  generateNewMnemonic,
  hexToUint8Array,
  restoreMnemonic,
  secp256k1GenerateProtectedKeyPair,
} from '@/utils/crypto';
import { decryptMessage, encryptMessage } from '@/utils/nostr';

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
      const { masterKey } = message.payload;
      const { mnemonic, protectedMnemonic } = generateNewMnemonic(masterKey);

      const { publicKey, protectedPrivateKey } =
        secp256k1GenerateProtectedKeyPair(masterKey);

      const liquidDescriptor = await generateLiquidDescriptor(mnemonic);

      const response: CryptoWorkerResponse = {
        type: 'newWallet',
        payload: {
          protectedMnemonic: protectedMnemonic,
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
      const { masterKey } = message.payload;

      const { mnemonic, protectedMnemonic } = restoreMnemonic(
        message.payload.mnemonic,
        masterKey
      );

      const { publicKey, protectedPrivateKey } =
        secp256k1GenerateProtectedKeyPair(masterKey);

      const [liquidDescriptor, error] = await toWithError(
        generateLiquidDescriptor(mnemonic)
      );

      if (error) {
        self.postMessage({ type: 'error', msg: error });
      } else {
        const response: CryptoWorkerResponse = {
          type: 'newWallet',
          payload: {
            protectedMnemonic: protectedMnemonic,
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
      const { descriptor, masterKey, pset, wallet_account_id } =
        message.payload;

      const unprotectedMnemonic = nip44.v2.decrypt(
        message.payload.mnemonic,
        hexToBytes(masterKey)
      );

      const signedPset = signPset(
        Buffer.from(unprotectedMnemonic).toString('utf-8'),
        descriptor,
        pset
      );

      const response: CryptoWorkerResponse = {
        type: 'signPset',
        payload: {
          wallet_account_id,
          signedPset,
        },
      };

      self.postMessage(response);

      break;
    }

    case 'decryptMnemonic': {
      const { protectedMnemonic, masterKey } = message.payload;

      const unprotectedMnemonic = nip44.v2.decrypt(
        protectedMnemonic,
        hexToBytes(masterKey)
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

    case 'encryptMessage': {
      const {
        contact_id,
        masterKey,
        protectedPrivateKey,
        receiver_money_address,
        receiver_pubkey,
        sender_message,
        receiver_message,
      } = message.payload;

      const unprotectedPrivateKey = nip44.v2.decrypt(
        protectedPrivateKey,
        hexToBytes(masterKey)
      );

      const publicKey = getPublicKey(unprotectedPrivateKey).subarray(1, 33);

      const sender_payload = encryptMessage(
        sender_message,
        hexToUint8Array(unprotectedPrivateKey),
        bufToHex(publicKey)
      );

      const receiver_payload = encryptMessage(
        receiver_message,
        hexToUint8Array(unprotectedPrivateKey),
        receiver_pubkey.substring(2)
      );

      const response: CryptoWorkerResponse = {
        type: 'encryptMessage',
        payload: {
          contact_id,
          receiver_money_address,
          receiver_payload: JSON.stringify(receiver_payload),
          sender_payload: JSON.stringify(sender_payload),
        },
      };

      self.postMessage(response);

      break;
    }

    case 'decryptMessages': {
      const { protectedPrivateKey, masterKey, messages } = message.payload;

      const unprotectedPrivateKey = nip44.v2.decrypt(
        protectedPrivateKey,
        hexToBytes(masterKey)
      );

      const unprotectedMessages = messages.map(m => {
        try {
          const event = JSON.parse(m.payload);

          const message = decryptMessage(
            event,
            hexToUint8Array(unprotectedPrivateKey)
          );

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
