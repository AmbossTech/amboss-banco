import { Mnemonic, Network, Signer } from 'lwk_wasm';

import {
  generateNewMnemonic,
  secp256k1GenerateProtectedKeyPair,
} from '@/utils/crypto';

import { CryptoNewWalletPayload } from './crypto/types';

export const generateLiquidDescriptor = async (mnemonic: string) => {
  const network = Network.mainnet();

  const signer = new Signer(new Mnemonic(mnemonic), network);
  const wolletDescriptor = signer.wpkhSlip77Descriptor().toString();

  return wolletDescriptor;
};

export const createNewWallet = async (
  masterKey: string
): Promise<CryptoNewWalletPayload> => {
  const { mnemonic, protectedMnemonic } = generateNewMnemonic(masterKey);

  const { publicKey, protectedPrivateKey } =
    secp256k1GenerateProtectedKeyPair(masterKey);

  const liquidDescriptor = await generateLiquidDescriptor(mnemonic);

  return {
    protectedMnemonic: protectedMnemonic,
    liquidDescriptor,
    secp256k1_key_pair: {
      public_key: publicKey,
      protected_private_key: protectedPrivateKey,
    },
  };
};
