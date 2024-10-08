import { generateMasterKeyAndHash } from '@/utils/argon';
import {
  changeProtectedSymmetricKey,
  createProtectedSymmetricKey,
  decryptSymmetricKey,
  secp256k1GenerateProtectedKeyPair,
} from '@/utils/crypto';

import { createNewWallet } from '../crypto/crypto';
import { CreateAccountResult, WorkerMessage, WorkerResponse } from './types';

async function generateAccount(
  email: string,
  password: string,
  password_hint?: string,
  referral_code?: string
): Promise<CreateAccountResult> {
  const { masterKey, masterPasswordHash } = await generateMasterKeyAndHash({
    email,
    password,
  });

  const { symmetricKey, protectedSymmetricKey } = createProtectedSymmetricKey({
    masterKey,
  });

  const { publicKey, protectedPrivateKey } = secp256k1GenerateProtectedKeyPair({
    symmetricKey,
  });

  const wallet = await createNewWallet({ symmetricKey });

  return {
    email,
    master_password_hash: masterPasswordHash,
    password_hint: password_hint || undefined,
    referral_code: referral_code || undefined,
    protected_symmetric_key: protectedSymmetricKey,
    secp256k1_key_pair: {
      public_key: publicKey,
      protected_private_key: protectedPrivateKey,
    },
    wallet,
  };
}

self.onmessage = async e => {
  const message: WorkerMessage = e.data;

  try {
    switch (message.type) {
      case 'create': {
        const {
          payload: { email, password, password_hint, referral_code },
        } = message;

        const accountParams = await generateAccount(
          email,
          password,
          password_hint,
          referral_code
        );

        const response: WorkerResponse = {
          type: 'create',
          payload: accountParams,
        };

        self.postMessage(response);

        break;
      }

      case 'generateMaster': {
        const {
          payload: { email, password, protectedSymmetricKey },
        } = message;

        const result = await generateMasterKeyAndHash({ email, password });

        const response: WorkerResponse = {
          type: 'generateMaster',
          payload: {
            ...result,
            protectedSymmetricKey,
          },
        };

        self.postMessage(response);

        break;
      }

      case 'changePassword': {
        const {
          payload: {
            email,
            currentPassword,
            newPassword,
            newPasswordHint,
            currentMasterKey,
            currentProtectedSymmetricKey,
          },
        } = message;

        const current = await generateMasterKeyAndHash({
          email,
          password: currentPassword,
        });

        const symmetricKey = decryptSymmetricKey({
          protectedSymmetricKey: currentProtectedSymmetricKey,
          masterKey: currentMasterKey,
        });

        const result = await generateMasterKeyAndHash({
          email,
          password: newPassword,
        });

        const newProtectedSymmetricKey = changeProtectedSymmetricKey({
          symmetricKey,
          newMasterKey: result.masterKey,
        });

        const response: WorkerResponse = {
          type: 'changePassword',
          payload: {
            currentMasterKeyHash: current.masterPasswordHash,
            newMasterKeyHash: result.masterPasswordHash,
            newProtectedSymmetricKey,
            newPasswordHint,
          },
        };

        self.postMessage(response);

        break;
      }

      case 'enablePasskeyEncryption': {
        const { keys, prfSecret, options } = message.payload;

        const symmetricKey = decryptSymmetricKey(keys);

        const newProtectedSymmetricKey = changeProtectedSymmetricKey({
          symmetricKey,
          newMasterKey: prfSecret,
        });

        const response: WorkerResponse = {
          type: 'enablePasskeyEncryption',
          payload: {
            protected_symmetric_key: newProtectedSymmetricKey,
            options,
          },
        };

        self.postMessage(response);

        break;
      }

      default:
        console.error('Unhandled message type:', e.data.type);
        break;
    }
  } catch (error) {
    console.error(error);

    let response: WorkerResponse;

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
