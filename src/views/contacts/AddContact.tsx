'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button-v2';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useCreateContactMutation } from '@/graphql/mutations/__generated__/contact.generated';
import { GetWalletContactsDocument } from '@/graphql/queries/__generated__/contacts.generated';
import { useContactStore } from '@/stores/contacts';
import { handleApolloError } from '@/utils/error';

export const AddContact: FC<{
  walletId: string;
  openAdd: boolean;
  setOpenAdd: Dispatch<SetStateAction<boolean>>;
}> = ({ walletId, openAdd, setOpenAdd }) => {
  const t = useTranslations();
  const { toast } = useToast();

  const [address, setAddress] = useState('');

  useEffect(() => {
    if (!openAdd) {
      setAddress('');
    }
  }, [openAdd]);

  const setContact = useContactStore(s => s.setCurrentContact);

  const [create, { loading }] = useCreateContactMutation({
    onCompleted: data => {
      setOpenAdd(false);

      toast({
        variant: 'default',
        title: 'Contact Added',
        description: 'New contact has been added successfully.',
      });

      const { id, money_address } = data.contacts.create;

      const [user, domain] = data.contacts.create.money_address.split('@');

      setContact({
        id,
        user,
        domain,
        address: money_address,
      });
    },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error Adding Contact',
        description: messages.join(', '),
      });
    },
    refetchQueries: [
      { query: GetWalletContactsDocument, variables: { id: walletId } },
    ],
  });

  return (
    <div>
      <p className="mb-4 text-2xl font-semibold">
        {t('App.Contacts.new-contact')}
      </p>

      <p className="mb-6 text-sm font-medium text-slate-600 dark:text-neutral-400">
        {t('App.Contacts.add-contact')}
      </p>

      <label htmlFor="address" className="mb-2 block font-semibold">
        {t('App.Contacts.address')}
      </label>

      <Input
        id="address"
        type="text"
        value={address}
        onChange={e => setAddress(e.target.value)}
        disabled={loading}
      />

      <p className="mt-2 text-sm text-slate-600 dark:text-neutral-400">
        {t('App.Contacts.input')}
      </p>

      <Button
        onClick={() => {
          create({
            variables: {
              input: {
                wallet_id: walletId,
                money_address: address,
              },
            },
          });
        }}
        disabled={!address || loading}
        className="mt-4 flex w-full items-center justify-center"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
        ) : null}
        {t('App.Contacts.create')}
      </Button>
    </div>
  );
};
