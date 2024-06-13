import { useLocalStorage } from 'usehooks-ts';

import { useGetWalletContactQuery } from '@/graphql/queries/__generated__/contacts.generated';
import { useUserQuery } from '@/graphql/queries/__generated__/user.generated';
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
      lnurl_info: {
        active: false,
        min_sendable: undefined,
        max_sendable: undefined,
        variable_fee_percentage: undefined,
        fixed_fee: undefined,
      },
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
      lnurl_info: {
        active: !!data?.wallets.find_one.contacts.find_one.lnurl_info,
        min_sendable:
          data?.wallets.find_one.contacts.find_one.lnurl_info?.min_sendable,
        max_sendable:
          data?.wallets.find_one.contacts.find_one.lnurl_info?.max_sendable,
        variable_fee_percentage:
          data?.wallets.find_one.contacts.find_one.lnurl_info
            ?.variable_fee_percentage,
        fixed_fee:
          data?.wallets.find_one.contacts.find_one.lnurl_info?.fixed_fee,
      },
    },
  };
};

export const useUserInfo = () => {
  const { data, loading } = useUserQuery({
    errorPolicy: 'ignore',
  });

  if (loading || !data?.user) {
    return { loading };
  }

  return {
    loading,
  };
};
