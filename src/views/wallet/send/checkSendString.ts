export const checkSendString = (str: string) => {
  switch (true) {
    case str.includes('@'):
      return str.split('@')[1] === 'bancolibre.com'
        ? 'miban'
        : 'lightning-address';
    case str.startsWith('lnbc'):
      return 'invoice';
    case str.startsWith('lq'):
    case str.startsWith('liquid:'):
      return 'liquid';
  }
};
