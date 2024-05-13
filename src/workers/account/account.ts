import {
  argon2Hash,
  createProtectedSymmetricKey,
  rsaGenerateProtectedKeyPair,
} from '@/utils/crypto';

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

  const { protectedSymmetricKey, iv } =
    await createProtectedSymmetricKey(masterKey);

  const { publicKey, protectedPrivateKey } = await rsaGenerateProtectedKeyPair(
    masterKey,
    iv
  );

  return {
    email,
    master_password_hash: masterPasswordHash,
    password_hint: password_hint || undefined,
    symmetric_key_iv: iv,
    protected_symmetric_key: protectedSymmetricKey,
    rsa_key_pair: {
      public_key: publicKey,
      protected_private_key: protectedPrivateKey,
    },
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