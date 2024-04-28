export const STORAGE_KEYS = {
  authToken: 'amboss-banco-api-auth',
  userAuthPin: 'amboss-banco-user-auth-pin',
  userEnabledBiometrics: 'amboss-banco-user-enabled-biometrics',
  walletSeed: (index: number) => `amboss-banco-wallet-seed-${index}`,
};

export const ROUTES = {
  home: '/',
  wallet: {
    tabs: '/wallet/tabs',
  },
  login: {
    main: '/login',
    setPin: '/login/set-pin',
    setBiometric: '/login/set-biometric',
    pin: (email: string) => `/login/pin?email=${email}`,
  },
  onboard: {
    wallet: {
      main: '/onboard/wallet',
      new: '/onboard/wallet/new',
      restore: '/onboard/wallet/restore',
    },
  },
};
