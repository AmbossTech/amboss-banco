export type WorkerMessageT<T> = {
  type: "init" | "data" | "error" | "stop" | "sign";
  payload?: {
    id?: string;
    data: T;
  };
};

export type CryptoWorkConfigT = {
  assets: string; // bitcoin,ethereum,monero,litecoin
};

export type PSET = {
  base64: string;
};
