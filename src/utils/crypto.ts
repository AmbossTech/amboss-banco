import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import argon2 from 'argon2-browser';
import { randomBytes } from 'crypto';

// Same defaults as those in Bitwarden
export const ARGON_DEFAULTS = {
  hash_length: 32,
  iterations: 3,
  memory: 64000,
  parallelism: 4,
};

export const bufToHex = (buf: Buffer | ArrayBuffer): string =>
  Buffer.from(buf).toString('hex');

export const bufToUTF8 = (buf: Buffer | ArrayBuffer): string =>
  Buffer.from(buf).toString('utf-8');

export const hexToBuf = (str: string): Buffer => Buffer.from(str, 'hex');

export const generateNewMnemonic = async (masterKey: string, iv: string) => {
  const mnemonic = generateMnemonic(wordlist);
  const mnemonicBuffer = Buffer.from(mnemonic, 'utf-8');
  const protectedMnemonic = await encryptCipher(mnemonicBuffer, masterKey, iv);

  return {
    mnemonic,
    protectedMnemonic,
  };
};

export const restoreMnemonic = async (
  mnemonic: string,
  masterKey: string,
  iv: string
) => {
  const mnemonicBuffer = Buffer.from(mnemonic, 'utf-8');
  const protectedMnemonic = await encryptCipher(mnemonicBuffer, masterKey, iv);

  return {
    mnemonic,
    protectedMnemonic,
  };
};

export const argon2Hash = async (
  key: string,
  salt: string
): Promise<string> => {
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

export const createSymmetricKey = (): {
  symmetricKey: Buffer;
  iv: Buffer;
} => {
  const symmetricKey = randomBytes(64);
  const iv = randomBytes(16);

  return { symmetricKey, iv };
};

export const createProtectedSymmetricKey = async (
  masterKey: string
): Promise<{
  protectedSymmetricKey: string;
  iv: string;
}> => {
  const { symmetricKey, iv } = createSymmetricKey();

  const importedMasterKey = await crypto.subtle.importKey(
    'raw', // raw or jwk
    Buffer.from(masterKey, 'hex'),
    'AES-CBC',
    false, // extractable
    ['encrypt']
  );

  const protectedSymmetricKey = await crypto.subtle.encrypt(
    {
      name: 'AES-CBC',
      iv,
    },
    importedMasterKey,
    symmetricKey
  );

  return {
    protectedSymmetricKey: bufToHex(protectedSymmetricKey),
    iv: bufToHex(iv),
  };
};

export const decryptCipher = async (
  cipher: ArrayBuffer,
  masterKey: string,
  iv: string
): Promise<ArrayBuffer> => {
  const importedMasterKey = await crypto.subtle.importKey(
    'raw', // raw or jwk
    Buffer.from(masterKey, 'hex'),
    'AES-CBC',
    false, // extractable
    ['decrypt']
  );

  const decryptedCipher = await crypto.subtle.decrypt(
    {
      name: 'AES-CBC',
      iv: hexToBuf(iv),
    },
    importedMasterKey,
    cipher
  );

  return decryptedCipher;
};

export const encryptCipher = async (
  cipher: ArrayBuffer,
  masterKey: string,
  iv: string
): Promise<ArrayBuffer> => {
  const importedMasterKey = await crypto.subtle.importKey(
    'raw', // raw or jwk
    Buffer.from(masterKey, 'hex'),
    'AES-CBC',
    false, // extractable
    ['encrypt']
  );

  const encryptedCipher = await crypto.subtle.encrypt(
    {
      name: 'AES-CBC',
      iv: hexToBuf(iv),
    },
    importedMasterKey,
    cipher
  );

  return encryptedCipher;
};

export const rsaGenerateKeyPair = async (): Promise<
  [ArrayBuffer, ArrayBuffer]
> => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
      hash: 'SHA-1',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return [publicKey, privateKey];
};

export const rsaGenerateProtectedKeyPair = async (
  masterKey: string,
  iv: string
) => {
  const [publicKey, privateKey] = await rsaGenerateKeyPair();

  const importedMasterKey = await crypto.subtle.importKey(
    'raw', // raw or jwk
    Buffer.from(masterKey, 'hex'),
    'AES-CBC',
    false, // extractable
    ['encrypt']
  );

  const protectedPrivateKey = await crypto.subtle.encrypt(
    {
      name: 'AES-CBC',
      iv: hexToBuf(iv),
    },
    importedMasterKey,
    privateKey
  );

  return {
    publicKey: bufToHex(publicKey),
    protectedPrivateKey: bufToHex(protectedPrivateKey),
  };
};
