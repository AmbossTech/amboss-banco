'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useLocalStorage } from 'usehooks-ts';

import { useToast } from '@/components/ui/use-toast';
import { useGetWalletSwapsQuery } from '@/graphql/queries/__generated__/swaps.generated';
import { SimpleSwap } from '@/graphql/types';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';

import { Swap } from './Swap';
import { SwapsTable } from './SwapsTable';

export const columns: ColumnDef<SimpleSwap>[] = [
  {
    id: 'swap',
    cell: ({ row }) => <Swap data={row.original} />,
  },
];

export const Swaps = () => {
  const t = useTranslations('Index');
  const { toast } = useToast();

  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const { data, loading } = useGetWalletSwapsQuery({
    variables: { id: value },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error getting swaps.',
        description: messages.join(', '),
      });
    },
  });

  const swaps = data?.wallets.find_one.swaps.find_many || [];

  return (
    <div className="mx-auto w-full max-w-lg py-4 lg:py-10">
      <h1 className="mb-6 text-3xl font-semibold">{t('swaps')}</h1>

      <SwapsTable<SimpleSwap>
        data={swaps}
        columns={columns}
        loading={loading}
      />
    </div>
  );
};
