import { hexToBytes, randomBytes } from '@noble/hashes/utils';
import { getPublicKey, utils } from '@noble/secp256k1';
import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { nip44 } from 'nostr-tools';

import { KeysType } from '@/stores/keys';

export const hexToUint8Array = (str: string): Uint8Array =>
  new Uint8Array(Buffer.from(str, 'hex'));

export const bufToHex = (buf: Buffer | ArrayBuffer): string =>
  Buffer.from(buf).toString('hex');

export const bufToUTF8 = (buf: Buffer | ArrayBuffer): string =>
  Buffer.from(buf).toString('utf-8');

export const hexToBuf = (str: string): Buffer => Buffer.from(str, 'hex');

export const uint8arrayToUtf8 = (str: Uint8Array): string => {
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(str);
};

export const secp256k1GenerateProtectedKeyPair = ({
  symmetricKey,
}: {
  symmetricKey: string;
}) => {
  const privateKey = utils.randomPrivateKey();
  const publicKey = getPublicKey(privateKey);

  const privateKeyHex = bufToHex(privateKey);

  const protectedPrivateKey = nip44.v2.encrypt(
    privateKeyHex,
    hexToBytes(symmetricKey)
  );

  return {
    publicKey: bufToHex(publicKey),
    protectedPrivateKey: protectedPrivateKey,
  };
};

export const generateNewMnemonic = ({
  symmetricKey,
}: {
  symmetricKey: string;
}) => {
  const mnemonic = generateMnemonic(wordlist);
  const protectedMnemonic = nip44.v2.encrypt(
    mnemonic,
    hexToBytes(symmetricKey)
  );

  return {
    mnemonic,
    protectedMnemonic,
  };
};

export const restoreMnemonic = ({
  mnemonic,
  symmetricKey,
}: {
  mnemonic: string;
  symmetricKey: string;
}) => {
  const protectedMnemonic = nip44.v2.encrypt(
    mnemonic,
    hexToBytes(symmetricKey)
  );

  return {
    mnemonic,
    protectedMnemonic,
  };
};

export const createProtectedSymmetricKey = ({
  masterKey,
}: {
  masterKey: string;
}): { symmetricKey: string; protectedSymmetricKey: string } => {
  const symmetricKey = Buffer.from(randomBytes(64)).toString('hex');

  const protectedSymmetricKey = nip44.v2.encrypt(
    symmetricKey,
    hexToBytes(masterKey)
  );

  return { symmetricKey, protectedSymmetricKey };
};

export const decryptSymmetricKey = (keys: KeysType): string => {
  return nip44.v2.decrypt(
    keys.protectedSymmetricKey,
    hexToBytes(keys.masterKey)
  );
};

export const changeProtectedSymmetricKey = ({
  symmetricKey,
  newMasterKey,
}: {
  symmetricKey: string;
  newMasterKey: string;
}) => {
  const protectedSymmetricKey = nip44.v2.encrypt(
    symmetricKey,
    hexToBytes(newMasterKey)
  );

  return protectedSymmetricKey;
};
