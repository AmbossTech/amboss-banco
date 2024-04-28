export const STORAGE_KEYS = {
  authToken: 'amboss-banco-api-auth',
};

export const ROUTES = {
  home: '/',
  wallet: {
    tabs: '/wallet/tabs',
  },
  login: {
    main: '/login',
    pin: (email: string) => `/login/pin?email=${email}`,
  },
};
