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
    };

export type CryptoWorkerResponse = {
  type: 'newWallet';
  payload: {
    protectedMnemonic: string;
    liquidDescriptor: string;
  };
};
