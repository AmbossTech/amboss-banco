import { create } from 'zustand';

import { PaymentOptionCode } from '@/graphql/types';

type Contact = {
  id: string;
  user: string;
  domain: string;
  address: string;
};

type ContactState = {
  currentContact: Contact | undefined;
  setCurrentContact: (contact: Contact | undefined) => void;
};

export const useContactStore = create<ContactState>()(set => ({
  currentContact: undefined,
  setCurrentContact: contact => set({ currentContact: contact }),
}));

export type PaymentOption = {
  id: string;
  name: string;
  code: PaymentOptionCode;
  network: string;
  symbol: string;
  max_sendable: number | null;
  min_sendable: number | null;
  decimals: number;
  fixed_fee: number;
  variable_fee_percentage: number;
};

type ChatState = {
  currentChatBox: string;
  currentPaymentOption: PaymentOption | undefined;
  setCurrentChatBox: (type: string) => void;
  setCurrentPaymentOption: (option: PaymentOption | undefined) => void;
};

export const useChat = create<ChatState>()(set => ({
  currentChatBox: 'message',
  currentPaymentOption: undefined,
  setCurrentChatBox: (type: string) => set({ currentChatBox: type }),
  setCurrentPaymentOption: (option: PaymentOption | undefined) =>
    set({ currentPaymentOption: option }),
}));
