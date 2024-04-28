import { create } from 'zustand';

type WalletStore = {
  walletId: string | undefined;
  accountId: string | undefined;
  assetId: string | undefined;
  setWallet: (walletId: string) => void;
  setAccountAndAsset: (accountId: string, assetId: string) => void;
  //   setAsset: (assetId: string) => void;
};

export const useWalletStore = create<WalletStore>()(set => ({
  //   loading: false,
  walletId: undefined,
  accountId: undefined,
  assetId: undefined,
  setWallet: (walletId: string) => set({ walletId }),
  setAccountAndAsset: (accountId: string, assetId: string) =>
    set({ accountId, assetId }),
  //   setAsset: (assetId: string) => set({ assetId }),
}));
