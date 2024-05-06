export type CreateAccount = {
  email: string;
  password: string;
  password_hint?: string;
};

export type WorkerMessage<T> = {
  type: 'create';
  payload: T;
};

export type CreateAccountResult = {
  email: string;
  master_password_hash: string;
  password_hint: string | undefined;
  symmetric_key_iv: string;
  protected_symmetric_key: string;
  rsa_key_pair: {
    public_key: string;
    protected_private_key: string;
  };
};

export type WorkerResponse<T> = {
  type: 'create';
  payload: T;
};
