import {
  argon2Hash,
  createProtectedSymmetricKey,
  rsaGenerateProtectedKeyPair,
} from '@/utils/crypto';

import {
  CreateAccount,
  CreateAccountResult,
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

self.onmessage = async e => {
  switch (e.data.type) {
    case 'create':
      const message: WorkerMessage<CreateAccount> = e.data;

      const {
        payload: { email, password, password_hint },
      } = message;

      const accountParams = await generateAccount(
        email,
        password,
        password_hint
      );

      const response: WorkerResponse<CreateAccountResult> = {
        type: 'create',
        payload: accountParams,
      };

      self.postMessage(response);

      break;
    default:
      console.error('Unhandled message type:', e.data.type);
      break;
  }
};
