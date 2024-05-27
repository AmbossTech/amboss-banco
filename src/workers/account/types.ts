export type CreateAccount = {
  email: string;
  password: string;
  password_hint?: string;
};

export type GenerateMasterKeyAndHash = {
  email: string;
  password: string;
};

export type WorkerMessage =
  | {
      type: 'create';
      payload: CreateAccount;
    }
  | {
      type: 'generateMaster';
      payload: GenerateMasterKeyAndHash;
    };

export type CreateAccountResult = {
  email: string;
  master_password_hash: string;
  password_hint: string | undefined;
  symmetric_key_iv: string;
  protected_symmetric_key: string;
  secp256k1_key_pair: {
    public_key: string;
    protected_private_key: string;
  };
};

export type GenerateMasterKeyAndHashResult = {
  masterKey: string;
  masterPasswordHash: string;
};

export type WorkerResponse =
  | {
      type: 'create';
      payload: CreateAccountResult;
    }
  | {
      type: 'generateMaster';
      payload: GenerateMasterKeyAndHashResult;
    };
