import { CryptoNewWalletPayload } from '../crypto/types';

export type CreateAccount = {
  email: string;
  password: string;
  password_hint?: string;
  referral_code?: string;
};

export type WorkerMessage =
  | {
      type: 'create';
      payload: CreateAccount;
    }
  | {
      type: 'generateMaster';
      payload: {
        email: string;
        password: string;
        protectedSymmetricKey: string;
      };
    }
  | {
      type: 'changePassword';
      payload: {
        email: string;
        currentPassword: string;
        newPassword: string;
        newPasswordHint?: string;
        currentProtectedSymmetricKey: string;
      };
    };

export type CreateAccountResult = {
  email: string;
  master_password_hash: string;
  password_hint: string | undefined;
  referral_code: string | undefined;
  protected_symmetric_key: string;
  secp256k1_key_pair: {
    public_key: string;
    protected_private_key: string;
  };
  wallet: CryptoNewWalletPayload;
};

export type WorkerResponse =
  | {
      type: 'create';
      payload: CreateAccountResult;
    }
  | {
      type: 'generateMaster';
      payload: {
        masterKey: string;
        masterPasswordHash: string;
        protectedSymmetricKey: string;
      };
    }
  | {
      type: 'changePassword';
      payload: {
        currentMasterKeyHash: string;
        newMasterKeyHash: string;
        newProtectedSymmetricKey: string;
        newPasswordHint?: string;
      };
    }
  | { type: 'loaded' }
  | { type: 'error'; msg: string };
