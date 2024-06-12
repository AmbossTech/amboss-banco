export const ROUTES = {
  home: '/',
  signup: '/sign-up',
  login: '/login',
  app: {
    home: '/app',
    user: '/app/user',
    wallet: {
      home: '/app/wallet',
      settings: (id: string) => `/app/wallet/${id}/settings`,
      send: (walletId: string, accountId: string, assetId: string) =>
        `/app/wallet/${walletId}/account/${accountId}/send?assetId=${assetId}`,
      receive: (walletId: string, accountId: string) =>
        `/app/wallet/${walletId}/account/${accountId}/receive`,
    },
    contacts: {
      home: '/app/contacts',
    },
  },
  setup: {
    wallet: {
      home: '/setup/wallet',
      new: '/setup/wallet/new',
      restore: '/setup/wallet/restore',
    },
  },
};
