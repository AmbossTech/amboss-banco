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
    },
  },
};
