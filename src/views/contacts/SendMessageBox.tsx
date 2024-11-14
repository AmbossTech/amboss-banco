'use client';

import { Loader2, SendHorizonal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FC, useCallback, useMemo, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Button } from '@/components/ui/button-v2';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useGetWalletContactQuery } from '@/graphql/queries/__generated__/contacts.generated';
import { useSendMessage } from '@/hooks/message';
import { useContactStore } from '@/stores/contacts';
import { useKeyStore } from '@/stores/keys';
import { cn } from '@/utils/cn';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';

export const SendMessageBox: FC<{ contactsLoading: boolean }> = ({
  contactsLoading,
}) => {
  const t = useTranslations();

  const [message, setMessage] = useState<string>('');

  const cbk = useCallback(() => setMessage(''), []);

  const { sendMessage, loading } = useSendMessage(cbk);

  const { toast } = useToast();

  const keys = useKeyStore(s => s.keys);

  const currentContact = useContactStore(s => s.currentContact);

  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const {
    data,
    loading: contactLoading,
    error,
  } = useGetWalletContactQuery({
    variables: { id: value, contact_id: currentContact?.id || '' },
    skip: !currentContact?.id,
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error Getting Contact Info',
        description: messages.join(', '),
      });
    },
  });

  const placeholder = useMemo(() => {
    switch (true) {
      case contactLoading || loading:
        return t('App.Contacts.loading');
      case Boolean(error):
        return t('Common.error');
      case !data?.wallets.find_one.contacts.find_one.encryption_pubkey:
        return t('App.Contacts.no-support');
      case !keys:
        return t('App.Contacts.locked');
      default:
        return t('App.Contacts.message');
    }
  }, [
    loading,
    error,
    data?.wallets.find_one.contacts.find_one.encryption_pubkey,
    keys,
  ]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentContact || !data?.wallets.find_one || !keys) return;

    sendMessage({
      contact_id: currentContact.id,
      protectedPrivateKey:
        data.wallets.find_one.secp256k1_key_pair
          .protected_encryption_private_key,
      keys,
      receiver_pubkey:
        data.wallets.find_one.contacts.find_one.encryption_pubkey,
      receiver_money_address:
        data.wallets.find_one.contacts.find_one.money_address,
      message,
    });
  };

  const disabled =
    !data?.wallets.find_one.contacts.find_one.encryption_pubkey ||
    !keys ||
    loading;

  if (contactsLoading)
    return <Skeleton className="min-h-10 w-full rounded-xl" />;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <Label htmlFor="message" className="sr-only">
        {t('App.Contacts.message')}
      </Label>

      <div className="relative">
        <Input
          type="text"
          autoComplete="off"
          value={message}
          onChange={e => {
            if (!loading) {
              setMessage(e.target.value);
            }
          }}
          placeholder={placeholder}
          className={cn(
            'pr-[50px]',
            loading && 'cursor-not-allowed opacity-50'
          )}
          disabled={
            !data?.wallets.find_one.contacts.find_one.encryption_pubkey || !keys
          }
        />

        <Button
          type="submit"
          disabled={disabled || !message}
          className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full p-0"
        >
          {contactLoading || loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <SendHorizonal size={16} />
          )}
        </Button>
      </div>
    </form>
  );
};
