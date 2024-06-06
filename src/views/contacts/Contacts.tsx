'use client';

import { Plus } from 'lucide-react';
import { FC, useEffect } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import {
  GetWalletContactsQuery,
  useGetWalletContactsQuery,
} from '@/graphql/queries/__generated__/contacts.generated';
import { cn } from '@/lib/utils';
import { useContactStore } from '@/stores/contacts';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';

import { AddContact } from './AddContact';
import { Messages } from './Messages';

type ContactType =
  GetWalletContactsQuery['wallets']['find_one']['contacts']['find_many'][0];

const ContactCard: FC<{ contact: ContactType }> = ({ contact }) => {
  const currentContact = useContactStore(s => s.currentContact);
  const setContact = useContactStore(s => s.setCurrentContact);

  const [user, domain] = contact.lightning_address.split('@');

  return (
    <button
      className={cn(
        'flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent',
        currentContact?.id === contact.id && 'bg-muted'
      )}
      onClick={() => setContact({ id: contact.id, user, domain })}
    >
      <div>
        <div className="font-semibold">{user}</div>
        <div className="text-xs text-muted-foreground">{domain}</div>
      </div>
    </button>
  );
};

export const Contacts = () => {
  const currentContact = useContactStore(s => s.currentContact);
  const setContact = useContactStore(s => s.setCurrentContact);

  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const { data } = useGetWalletContactsQuery({ variables: { id: value } });

  useEffect(() => {
    if (!!currentContact) return;
    if (!data?.wallets.find_one.contacts.find_many.length) return;

    const { id, lightning_address } =
      data.wallets.find_one.contacts.find_many[0];

    const [user, domain] = lightning_address.split('@');

    setContact({ id, user, domain });
  });

  const contacts = data?.wallets.find_one.contacts.find_many || [];

  return (
    <div className="my-4 grid flex-1 gap-4 overflow-auto md:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col gap-2">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-sm font-semibold md:text-lg">Contacts</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button size={'icon'} variant={'outline'}>
                <Plus className="size-4" />
              </Button>
            </DialogTrigger>
            <AddContact walletId={value} />
          </Dialog>
        </div>

        {contacts.length ? (
          contacts.map(c => <ContactCard key={c.id} contact={c} />)
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            Add a contact to start
          </div>
        )}
      </div>

      <Messages />
    </div>
  );
};
