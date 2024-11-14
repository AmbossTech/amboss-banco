'use client';

import { Plus, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react';
import { useDebounceValue, useLocalStorage, useMediaQuery } from 'usehooks-ts';

import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  GetWalletContactsQuery,
  useGetWalletContactsQuery,
} from '@/graphql/queries/__generated__/contacts.generated';
import { useContactStore } from '@/stores/contacts';
import { cn } from '@/utils/cn';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';

import { AddContact } from './AddContact';
import { Messages } from './Messages';

export type Views = 'contacts' | 'messages';

type ContactType =
  GetWalletContactsQuery['wallets']['find_one']['contacts']['find_many'][0];

const ContactCard: FC<{
  contact: ContactType;
  setView: Dispatch<SetStateAction<Views>>;
}> = ({ contact, setView }) => {
  const isDesktop = useMediaQuery('(min-width: 1024px)', {
    initializeWithValue: false,
  });

  const currentContact = useContactStore(s => s.currentContact);
  const setContact = useContactStore(s => s.setCurrentContact);

  const { id, money_address } = contact;

  const [user, domain] = contact.money_address.split('@');

  return (
    <button
      className={cn(
        'flex w-full items-center space-x-2 rounded-2xl p-2 transition-colors hover:bg-slate-200 dark:hover:bg-neutral-800',
        currentContact?.id === id && 'bg-slate-200 dark:bg-neutral-800'
      )}
      onClick={() => {
        setContact({
          id,
          user,
          domain,
          address: money_address,
        });

        if (!isDesktop) {
          setView('messages');
        }
      }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-medium uppercase text-black">
        {money_address.slice(0, 2)}
      </div>

      <div className="text-left">
        <p className="font-medium">{user}</p>

        <p className="text-sm font-medium text-slate-600 dark:text-neutral-400">
          {domain}
        </p>
      </div>
    </button>
  );
};

export const Contacts = () => {
  const t = useTranslations();
  const isDesktop = useMediaQuery('(min-width: 1024px)', {
    initializeWithValue: false,
  });

  const { toast } = useToast();

  const searchParams = useSearchParams();
  const addParam = searchParams.has('add');

  const [view, setView] = useState<Views>('contacts');
  const [openAdd, setOpenAdd] = useState(addParam);

  const [search, setSearch] = useDebounceValue('', 500);

  const currentContact = useContactStore(s => s.currentContact);
  const setContact = useContactStore(s => s.setCurrentContact);

  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const { data, loading } = useGetWalletContactsQuery({
    variables: { id: value },
    skip: !value,
    onCompleted: data => {
      if (!!currentContact) return;

      const { id, money_address } = data.wallets.find_one.contacts.find_many[0];

      const [user, domain] = money_address.split('@');

      setContact({ id, user, domain, address: money_address });
    },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error getting contacts.',
        description: messages.join(', '),
      });
    },
  });

  const contacts = useMemo(() => {
    const contacts = data?.wallets.find_one.contacts.find_many;

    if (!contacts) return [];
    if (!search) return contacts;

    return contacts.filter(c =>
      c.money_address.toLowerCase().includes(search.toLowerCase())
    );
  }, [data?.wallets.find_one.contacts.find_many, search]);

  return (
    <div className="mx-auto w-full max-w-4xl pb-4 pt-6 lg:pb-6">
      <div className="w-full lg:flex lg:space-x-6">
        {isDesktop || view === 'contacts' ? (
          <div className="w-full lg:w-1/3">
            <div className="mb-4 flex w-full items-center justify-between">
              <h1 className="text-2xl font-semibold">{t('Index.contacts')}</h1>

              <Drawer open={openAdd} onOpenChange={setOpenAdd}>
                <DrawerTrigger asChild>
                  <button className="m-2 transition-opacity hover:opacity-75">
                    <Plus size={24} />
                  </button>
                </DrawerTrigger>

                <DrawerContent>
                  <AddContact
                    walletId={value}
                    openAdd={openAdd}
                    setOpenAdd={setOpenAdd}
                  />
                </DrawerContent>
              </Drawer>
            </div>

            <div className="relative">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2"
              />

              <Input
                type="text"
                placeholder={t('App.Contacts.search')}
                defaultValue=""
                onChange={e => {
                  setSearch(e.target.value);
                }}
                disabled={loading}
                className="w-full pl-10"
              />
            </div>

            <div className="mt-6 h-[calc(100dvh-247px)] w-full space-y-1 overflow-y-auto md:h-[calc(100dvh-226px)] lg:h-[calc(100dvh-234px)]">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                ))
              ) : contacts.length ? (
                contacts.map(c => (
                  <ContactCard key={c.id} contact={c} setView={setView} />
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-primary p-3 text-center text-sm text-primary">
                  {t('App.Contacts.none')}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {isDesktop || view === 'messages' ? (
          <Messages contactsLoading={loading} setView={setView} />
        ) : null}
      </div>
    </div>
  );
};
