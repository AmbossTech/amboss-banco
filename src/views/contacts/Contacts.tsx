'use client';

import { Plus, User } from 'lucide-react';
import { FC, useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
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

const ContactCard: FC<{ contact: ContactType; cbk?: () => void }> = ({
  contact,
  cbk,
}) => {
  const currentContact = useContactStore(s => s.currentContact);
  const setContact = useContactStore(s => s.setCurrentContact);

  const [user, domain] = contact.money_address.split('@');

  return (
    <button
      className={cn(
        'flex w-full flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent',
        currentContact?.id === contact.id && 'bg-muted'
      )}
      onClick={() => {
        setContact({
          id: contact.id,
          user,
          domain,
          address: contact.money_address,
        });

        cbk?.();
      }}
    >
      <div>
        <div className="font-semibold">{user}</div>
        <div className="text-xs text-muted-foreground">{domain}</div>
      </div>
    </button>
  );
};

export const Contacts = () => {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const currentContact = useContactStore(s => s.currentContact);
  const setContact = useContactStore(s => s.setCurrentContact);

  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const { data } = useGetWalletContactsQuery({
    variables: { id: value },
    skip: !value,
  });

  useEffect(() => {
    if (!!currentContact) return;
    if (!data?.wallets.find_one.contacts.find_many.length) return;

    const { id, money_address } = data.wallets.find_one.contacts.find_many[0];

    const [user, domain] = money_address.split('@');

    setContact({ id, user, domain, address: money_address });
  });

  const contacts = data?.wallets.find_one.contacts.find_many || [];

  return (
    <div className="my-4 grid flex-1 gap-4 overflow-auto md:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col gap-2">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-sm font-semibold md:text-lg">Contacts</h1>
          <div className="flex gap-2">
            <Drawer open={openDrawer} onOpenChange={setOpenDrawer}>
              <DrawerTrigger asChild className="flex md:hidden">
                <Button size={'icon'} variant={'outline'}>
                  <User className="size-4" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Contacts</DrawerTitle>
                </DrawerHeader>

                <div className="flex max-h-80 flex-col gap-1 overflow-y-auto px-4">
                  {contacts.length ? (
                    contacts.map(c => (
                      <ContactCard
                        key={c.id}
                        contact={c}
                        cbk={() => setOpenDrawer(p => !p)}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                      Add a contact to start
                    </div>
                  )}
                </div>

                <DrawerFooter>
                  {/* <Button>Submit</Button> */}
                  <DrawerClose asChild>
                    <Button variant="outline">Close</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>

            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button size={'icon'} variant={'outline'}>
                  <Plus className="size-4" />
                </Button>
              </DialogTrigger>
              <AddContact walletId={value} setOpenDialog={setOpenDialog} />
            </Dialog>
          </div>
        </div>

        <div className="hidden w-full flex-col gap-2 md:flex">
          {contacts.length ? (
            contacts.map(c => <ContactCard key={c.id} contact={c} />)
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              Add a contact to start
            </div>
          )}
        </div>
      </div>

      <Messages />
    </div>
  );
};
