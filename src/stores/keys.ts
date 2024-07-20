import { create } from 'zustand';

export type KeysType = { masterKey: string; protectedSymmetricKey: string };

type KeyState = {
  keys: KeysType | undefined;
  setKeys: (keys: KeysType) => void;
  clear: () => void;
};

export const useKeyStore = create<KeyState>()(set => ({
  keys: undefined,
  setKeys: (keys: KeysType) => set({ keys }),
  clear: () => set({ keys: undefined }),
}));
