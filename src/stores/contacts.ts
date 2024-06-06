import { create } from 'zustand';

type Contact = {
  id: string;
  user: string;
  domain: string;
};

type ContactState = {
  currentContact: Contact | undefined;
  setCurrentContact: (contact: Contact) => void;
};

export const useContactStore = create<ContactState>()(set => ({
  currentContact: undefined,
  setCurrentContact: (contact: Contact) => set({ currentContact: contact }),
}));
