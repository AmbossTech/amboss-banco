import { create } from 'zustand';

type KeyState = {
  masterKey: string | undefined;
  setMasterKey: (masterKey: string) => void;
  clear: () => void;
};

export const useKeyStore = create<KeyState>()(set => ({
  masterKey: undefined,
  setMasterKey: (masterKey: string) => set({ masterKey }),
  clear: () => set({ masterKey: undefined }),
}));
