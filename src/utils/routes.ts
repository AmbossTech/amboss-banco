export const ROUTES = {
  home: '/',
  signup: '/sign-up',
  login: '/login',
  app: {
    home: '/app',
    user: '/app/user',
    wallet: {
      new: '/app/wallet/new',
      restore: '/app/wallet/restore',
      id: (id: string) => `/app/wallet/${id}`,
      settings: (id: string) => `/app/wallet/${id}/settings`,
      send: (walletId: string, accountId: string, assetId: string) =>
        `/app/wallet/${walletId}/account/${accountId}/send?assetId=${assetId}`,
      receive: (walletId: string, accountId: string) =>
        `/app/wallet/${walletId}/account/${accountId}/receive`,
    },
  },
};
