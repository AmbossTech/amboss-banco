export const ROUTES = {
  home: '/',
  signup: '/sign-up',
  login: {
    home: '/login',
  },
  dashboard: '/dashboard',
  settings: {
    home: '/settings',
    twofa: '/settings/2fa',
  },
  transactions: { home: '/transactions' },
  swaps: {
    home: '/swaps',
  },
  wallet: {
    home: '/wallet',
    settings: '/wallet/settings',
    receive: '/wallet/receive',
    send: {
      home: (walletId: string, accountId: string, assetId?: string) =>
        `/wallet/${walletId}/account/${accountId}/send${assetId ? `?assetId=${assetId}` : ''}`,
      address: (walletId: string, accountId: string, assetId: string) =>
        `/wallet/${walletId}/account/${accountId}/send/address?assetId=${assetId}`,
      invoice: (walletId: string, accountId: string, assetId: string) =>
        `/wallet/${walletId}/account/${accountId}/send/invoice?assetId=${assetId}`,
    },
  },
  contacts: {
    home: '/contacts',
  },
  setup: {
    wallet: {
      home: '/setup/wallet',
      new: '/setup/wallet/new',
      restore: '/setup/wallet/restore',
    },
  },
  success: {
    waitlist: '/success?variant=waitlist',
  },
  docs: {
    home: '/docs',
    faq: '/docs#faq',
    privacyPolicy: '/docs/legal/privacy-policy',
    termsOfService: '/docs/legal/terms-of-service',
  },
  external: {
    github: 'https://github.com/AmbossTech/amboss-banco',
    x: 'https://x.com/ambosstech',
    telegram: 'https://t.me/+FrzdhJw4piAzMzgx',
    support: 'mailto:support@amboss.tech',
  },
};
