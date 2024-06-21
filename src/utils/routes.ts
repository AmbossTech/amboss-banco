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
      receive: (walletId: string, accountId: string) =>
        `/app/wallet/${walletId}/account/${accountId}/receive`,
      send: {
        home: (walletId: string, accountId: string, assetId: string) =>
          `/app/wallet/${walletId}/account/${accountId}/send?assetId=${assetId}`,
        address: (walletId: string, accountId: string, assetId: string) =>
          `/app/wallet/${walletId}/account/${accountId}/send/address?assetId=${assetId}`,
        invoice: (walletId: string, accountId: string, assetId: string) =>
          `/app/wallet/${walletId}/account/${accountId}/send/invoice?assetId=${assetId}`,
      },
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
