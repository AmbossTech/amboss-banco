export type CryptoWorkerMessage =
  | {
      type: 'newWallet';
      payload: {
        masterKey: string;
        iv: string;
      };
    }
  | {
      type: 'restoreWallet';
      payload: {
        mnemonic: string;
        masterKey: string;
        iv: string;
      };
    }
  | {
      type: 'signPset';
      payload: {
        mnemonic: string;
        descriptor: string;
        masterKey: string;
        iv: string;
        pset: string;
      };
    };

export type CryptoWorkerResponse =
  | {
      type: 'newWallet';
      payload: {
        protectedMnemonic: string;
        liquidDescriptor: string;
      };
    }
  | {
      type: 'signPset';
      payload: {
        signedPset: string;
      };
    };
