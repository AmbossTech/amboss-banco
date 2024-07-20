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
import { Event, nip44 } from 'nostr-tools';

import { toWithError } from '@/utils/async';
import {
  bufToHex,
  decryptSymmetricKey,
  generateNewMnemonic,
  hexToUint8Array,
  restoreMnemonic,
  secp256k1GenerateProtectedKeyPair,
} from '@/utils/crypto';
import { decryptMessage, encryptMessage } from '@/utils/nostr';

import {
  CryptoNewWalletPayload,
  CryptoWorkerMessage,
  CryptoWorkerResponse,
} from './types';

export const createNewWallet = async ({
  symmetricKey,
}: {
  symmetricKey: string;
}): Promise<CryptoNewWalletPayload> => {
  const { mnemonic, protectedMnemonic } = generateNewMnemonic({ symmetricKey });

  const { publicKey, protectedPrivateKey } = secp256k1GenerateProtectedKeyPair({
    symmetricKey,
  });

  const liquidDescriptor = await generateLiquidDescriptor(mnemonic);

  return {
    protectedMnemonic: protectedMnemonic,
    liquidDescriptor,
    secp256k1_key_pair: {
      public_key: publicKey,
      protected_private_key: protectedPrivateKey,
    },
  };
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

  try {
    switch (message.type) {
      case 'newWallet': {
        const { keys } = message.payload;

        const symmetricKey = decryptSymmetricKey(keys);

        const payload = await createNewWallet({ symmetricKey });

        const response: CryptoWorkerResponse = {
          type: 'newWallet',
          payload,
        };

        self.postMessage(response);

        break;
      }

      case 'restoreWallet': {
        const { keys } = message.payload;

        const symmetricKey = decryptSymmetricKey(keys);

        const { mnemonic, protectedMnemonic } = restoreMnemonic({
          mnemonic: message.payload.mnemonic,
          symmetricKey,
        });

        const { publicKey, protectedPrivateKey } =
          secp256k1GenerateProtectedKeyPair({ symmetricKey });

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
        const { descriptor, keys, pset, wallet_account_id } = message.payload;

        const symmetricKey = decryptSymmetricKey(keys);

        const unprotectedMnemonic = nip44.v2.decrypt(
          message.payload.mnemonic,
          hexToBytes(symmetricKey)
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
        const { protectedMnemonic, keys } = message.payload;

        const symmetricKey = decryptSymmetricKey(keys);

        const unprotectedMnemonic = nip44.v2.decrypt(
          protectedMnemonic,
          hexToBytes(symmetricKey)
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
          keys,
          protectedPrivateKey,
          receiver_money_address,
          receiver_pubkey,
        } = message.payload;

        const symmetricKey = decryptSymmetricKey(keys);

        const unprotectedPrivateKey = nip44.v2.decrypt(
          protectedPrivateKey,
          hexToBytes(symmetricKey)
        );

        const publicKey = getPublicKey(unprotectedPrivateKey).subarray(1, 33);

        const sender_payload = encryptMessage(
          message.payload.message,
          hexToUint8Array(unprotectedPrivateKey),
          bufToHex(publicKey)
        );

        let receiver_payload: Event | null = null;

        if (!!receiver_pubkey) {
          receiver_payload = encryptMessage(
            message.payload.message,
            hexToUint8Array(unprotectedPrivateKey),
            receiver_pubkey.substring(2)
          );
        }

        const response: CryptoWorkerResponse = {
          type: 'encryptMessage',
          payload: {
            contact_id,
            receiver_money_address,
            sender_payload: JSON.stringify(sender_payload),
            receiver_payload: receiver_payload
              ? JSON.stringify(receiver_payload)
              : null,
          },
        };

        self.postMessage(response);

        break;
      }

      case 'decryptMessages': {
        const { protectedPrivateKey, keys, messages } = message.payload;

        const symmetricKey = decryptSymmetricKey(keys);

        const unprotectedPrivateKey = nip44.v2.decrypt(
          protectedPrivateKey,
          hexToBytes(symmetricKey)
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
  } catch (error) {
    console.error(error);

    let response: CryptoWorkerResponse;

    if (error instanceof Error) {
      response = {
        type: 'error',
        msg: error.message,
      };
    } else {
      response = {
        type: 'error',
        msg: 'Unknown error',
      };
    }

    self.postMessage(response);
  }
};

self.postMessage({ type: 'loaded' });
