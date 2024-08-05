import argon2 from 'argon2-browser';

export const ARGON_DEFAULTS = {
  hash_length: 32,
  iterations: 3,
  memory: 64000,
  parallelism: 4,
};

export const generateMasterKeyAndHash = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{ masterKey: string; masterPasswordHash: string }> => {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  const masterKey = await argon2Hash({
    key: cleanPassword,
    salt: normalizedEmail,
  });
  const masterPasswordHash = await argon2Hash({
    key: masterKey,
    salt: cleanPassword,
  });

  return {
    masterKey,
    masterPasswordHash,
  };
};

const argon2Hash = async ({
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
