import {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';

import { getSHA256, getSHA256ArrayBuffer } from './crypto';

const PRF_SALT = 'WebAuthn PRF';

export const getPRFSalt = async (): Promise<ArrayBuffer> => {
  return getSHA256ArrayBuffer(PRF_SALT);
};

export const cleanupWebauthnRegistrationResponse = (
  response: RegistrationResponseJSON
): { response: RegistrationResponseJSON } => {
  const { prf, ...rest } =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.clientExtensionResults as any;

  const newResponse: RegistrationResponseJSON = {
    ...response,
    clientExtensionResults: {
      ...rest,
      prf: {
        enabled: prf?.enabled || false,
      },
    },
  };

  return {
    response: newResponse,
  };
};

export const cleanupWebauthnAuthenticationResponse = async (
  response: AuthenticationResponseJSON
): Promise<{
  response: AuthenticationResponseJSON;
  prfSecretHash: string | undefined;
}> => {
  const { prf, ...rest } =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.clientExtensionResults as any;

  const newResponse: AuthenticationResponseJSON = {
    ...response,
    clientExtensionResults: rest,
  };

  if (!prf?.results.first) {
    return { response: newResponse, prfSecretHash: undefined };
  }

  const secretBuffer = Buffer.from(prf.results.first).toString('hex');
  const secretHash = await getSHA256(secretBuffer);

  return {
    response: newResponse,
    prfSecretHash: secretHash,
  };
};
