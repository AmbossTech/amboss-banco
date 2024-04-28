import { create } from 'zustand';

type SessionStore = {
  authToken: string | undefined;
  setAuthToken: (token: string | undefined) => void;
};

export const useSessionStore = create<SessionStore>()(set => ({
  authToken: undefined,
  setAuthToken: token => set({ authToken: token }),
}));
