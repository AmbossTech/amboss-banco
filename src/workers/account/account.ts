import {
  argon2Hash,
  createProtectedSymmetricKey,
  secp256k1GenerateProtectedKeyPair,
} from '@/utils/crypto';

import { createNewWallet } from '../crypto/crypto';
import {
  CreateAccountResult,
  GenerateMasterKeyAndHashResult,
  WorkerMessage,
  WorkerResponse,
} from './types';

async function generateAccount(
  email: string,
  password: string,
  password_hint?: string
): Promise<CreateAccountResult> {
  const masterKey = await argon2Hash(password, email);
  const masterPasswordHash = await argon2Hash(masterKey, password);

  const protectedSymmetricKey = createProtectedSymmetricKey(masterKey);

  const { publicKey, protectedPrivateKey } =
    secp256k1GenerateProtectedKeyPair(masterKey);

  const wallet = await createNewWallet(masterKey);

  return {
    email,
    master_password_hash: masterPasswordHash,
    password_hint: password_hint || undefined,
    protected_symmetric_key: protectedSymmetricKey,
    secp256k1_key_pair: {
      public_key: publicKey,
      protected_private_key: protectedPrivateKey,
    },
    wallet,
  };
}

async function generateMasterKeyAndHash(
  email: string,
  password: string
): Promise<GenerateMasterKeyAndHashResult> {
  const masterKey = await argon2Hash(password, email);
  const masterPasswordHash = await argon2Hash(masterKey, password);

  return {
    masterKey,
    masterPasswordHash,
  };
}

self.onmessage = async e => {
  const message: WorkerMessage = e.data;
  switch (message.type) {
    case 'create': {
      const {
        payload: { email, password, password_hint },
      } = message;

      const accountParams = await generateAccount(
        email,
        password,
        password_hint
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
        payload: { email, password },
      } = message;

      const result = await generateMasterKeyAndHash(email, password);

      const response: WorkerResponse = {
        type: 'generateMaster',
        payload: result,
      };

      self.postMessage(response);

      break;
    }

    default:
      console.error('Unhandled message type:', e.data.type);
      break;
  }
};

self.postMessage({ type: 'loaded' });
