import { hexToBytes, randomBytes } from '@noble/hashes/utils';
import { getPublicKey, utils } from '@noble/secp256k1';
import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import argon2 from 'argon2-browser';
import { nip44 } from 'nostr-tools';

import { KeysType } from '@/stores/keys';

export const ARGON_DEFAULTS = {
  hash_length: 32,
  iterations: 3,
  memory: 64000,
  parallelism: 4,
};

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

export const generateMasterKeyAndHash = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{ masterKey: string; masterPasswordHash: string }> => {
  const masterKey = await argon2Hash({ key: password, salt: email });
  const masterPasswordHash = await argon2Hash({
    key: masterKey,
    salt: password,
  });

  return {
    masterKey,
    masterPasswordHash,
  };
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

export const argon2Hash = async ({
  key,
  salt,
}: {
  key: string;
  salt: string;
}): Promise<string> => {
  const hashedPasswordHash = await argon2.hash({
    pass: key,
    salt,
    type: argon2.ArgonType.Argon2id,
    hashLen: ARGON_DEFAULTS.hash_length,
    time: ARGON_DEFAULTS.iterations,
    mem: ARGON_DEFAULTS.memory,
    parallelism: ARGON_DEFAULTS.parallelism,
  });

  return hashedPasswordHash.hashHex;
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
