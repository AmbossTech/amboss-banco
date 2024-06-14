import { useLocalStorage } from 'usehooks-ts';

import { useGetWalletContactQuery } from '@/graphql/queries/__generated__/contacts.generated';
import { useContactStore } from '@/stores/contacts';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';

export const useContactInfo = () => {
  const currentContact = useContactStore(s => s.currentContact);
  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const { data, loading } = useGetWalletContactQuery({
    variables: { id: value, contact_id: currentContact?.id || '' },
    skip: !currentContact?.id,
    errorPolicy: 'ignore',
  });

  const defaultInfo = {
    contact: {
      encryption_pubkey: '',
      payment_options: [],
    },
    loading,
  };

  if (loading) {
    return defaultInfo;
  }

  return {
    ...defaultInfo,
    contact: {
      ...defaultInfo.contact,
      encryption_pubkey:
        data?.wallets.find_one.contacts.find_one.encryption_pubkey,
      payment_options:
        data?.wallets.find_one.contacts.find_one.payment_options || [],
    },
  };
};
