import { Network, validate } from 'bitcoin-address-validation';
import { Address } from 'lwk_wasm';

import { getAddressFromBip21 } from '@/utils/string';

const lightningAddressRegex =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const devAddressRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@localhost:3000/;

const isLiquidAddress = (str: string) => {
  try {
    new Address(str);
    return true;
  } catch (error) {
    return false;
  }
};

export const checkSendString = (str: string) => {
  const bancoInstances = ['bancolibre.com', window.location.host];

  const strFormatted = str.toLowerCase();

  switch (true) {
    case lightningAddressRegex.test(strFormatted.replaceAll('lightning:', '')):
      return bancoInstances.includes(strFormatted.split('@')[1])
        ? 'miban'
        : 'lightning-address';
    case strFormatted.startsWith('liquidnetwork:'):
    case isLiquidAddress(str):
      return 'liquid';
    case strFormatted.startsWith('lnbc'):
    case strFormatted.startsWith('lightning:lnbc'):
    case strFormatted.startsWith('bitcoin:') &&
      strFormatted.includes('lightning='):
      return 'invoice';
    case validate(getAddressFromBip21(strFormatted), Network.mainnet):
      return 'bitcoin';
    case devAddressRegex.test(str):
      return 'dev';
  }
};
