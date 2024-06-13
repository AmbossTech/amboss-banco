export type CryptoWorkerMessage =
  | {
      type: 'newWallet';
      payload: {
        masterKey: string;
      };
    }
  | {
      type: 'restoreWallet';
      payload: {
        mnemonic: string;
        masterKey: string;
      };
    }
  | {
      type: 'signPset';
      payload: {
        wallet_account_id: string;
        mnemonic: string;
        descriptor: string;
        masterKey: string;
        pset: string;
      };
    }
  | {
      type: 'decryptMnemonic';
      payload: {
        protectedMnemonic: string;
        masterKey: string;
      };
    }
  | {
      type: 'eciesEncrypt';
      payload: {
        sender_pubkey: string;
        receiver_pubkey: string;
        receiver_money_address: string;
        msg: string;
      };
    }
  | {
      type: 'decryptMessages';
      payload: {
        protectedPrivateKey: string;
        masterKey: string;
        messages: {
          id: string;
          contact_is_sender: boolean;
          protected_message: string;
        }[];
      };
    };

export type CryptoWorkerResponse =
  | {
      type: 'newWallet';
      payload: {
        protectedMnemonic: string;
        liquidDescriptor: string;
        secp256k1_key_pair: {
          public_key: string;
          protected_private_key: string;
        };
      };
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
      type: 'eciesEncrypt';
      payload: {
        receiver_money_address: string;
        sender_protected_message: string;
        receiver_protected_message: string;
      };
    }
  | {
      type: 'decryptMessages';
      payload: {
        id: string;
        contact_is_sender: boolean;
        message: string;
      }[];
    }
  | { type: 'loaded' }
  | { type: 'error'; msg: string };
