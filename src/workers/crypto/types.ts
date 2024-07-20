import { KeysType } from '@/stores/keys';

export type CryptoWorkerMessage =
  | {
      type: 'newWallet';
      payload: {
        keys: KeysType;
      };
    }
  | {
      type: 'restoreWallet';
      payload: {
        mnemonic: string;
        keys: KeysType;
      };
    }
  | {
      type: 'signPset';
      payload: {
        wallet_account_id: string;
        mnemonic: string;
        descriptor: string;
        keys: KeysType;
        pset: string;
      };
    }
  | {
      type: 'decryptMnemonic';
      payload: {
        protectedMnemonic: string;
        keys: KeysType;
      };
    }
  | {
      type: 'encryptMessage';
      payload: {
        contact_id: string;
        protectedPrivateKey: string;
        keys: KeysType;
        receiver_pubkey: string | null | undefined;
        receiver_money_address: string;
        message: string;
      };
    }
  | {
      type: 'decryptMessages';
      payload: {
        protectedPrivateKey: string;
        keys: KeysType;
        messages: {
          id: string;
          contact_is_sender: boolean;
          payload: string;
          created_at: string;
        }[];
      };
    };

export type CryptoNewWalletPayload = {
  protectedMnemonic: string;
  liquidDescriptor: string;
  secp256k1_key_pair: {
    public_key: string;
    protected_private_key: string;
  };
};

export type CryptoWorkerResponse =
  | {
      type: 'newWallet';
      payload: CryptoNewWalletPayload;
    }
  | {
      type: 'signPset';
      payload: {
        wallet_account_id: string;
        signedPset: string;
      };
    }
  | {
      type: 'decryptMnemonic';
      payload: {
        mnemonic: string;
      };
    }
  | {
      type: 'encryptMessage';
      payload: {
        contact_id: string;
        receiver_money_address: string;
        sender_payload: string;
        receiver_payload: string | null;
      };
    }
  | {
      type: 'decryptMessages';
      payload: {
        id: string;
        contact_is_sender: boolean;
        message: string;
        created_at: string;
      }[];
    }
  | { type: 'loaded' }
  | { type: 'error'; msg: string };
