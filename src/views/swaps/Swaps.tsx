'use client';

import { useLocalStorage } from 'usehooks-ts';

import { useGetWalletSwapsQuery } from '@/graphql/queries/__generated__/swaps.generated';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';

export const Swaps = () => {
  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const { data, loading, error } = useGetWalletSwapsQuery({
    variables: { id: value },
  });

  console.log({ data: data?.wallets.find_one.swaps.find_many, loading, error });

  return <div>asdasd</div>;
};
