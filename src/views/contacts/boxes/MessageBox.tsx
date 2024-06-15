'use client';

import { CornerDownLeft, Loader2 } from 'lucide-react';
import { FC, ReactNode, useCallback, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { VaultButton } from '@/components/button/VaultButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useGetWalletContactQuery } from '@/graphql/queries/__generated__/contacts.generated';
import { useSendMessage } from '@/hooks/message';
import { useContactStore } from '@/stores/contacts';
import { useKeyStore } from '@/stores/keys';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';

export const SendMessageBox: FC<{ iconOptions?: ReactNode }> = ({
  iconOptions,
}) => {
  const [message, setMessage] = useState<string>('');

  const cbk = useCallback(() => setMessage(''), []);

  const { sendMessage, loading: sendLoading } = useSendMessage(cbk);

  const { toast } = useToast();

  const masterKey = useKeyStore(s => s.masterKey);

  const currentContact = useContactStore(s => s.currentContact);

  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const { data, loading } = useGetWalletContactQuery({
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (sendLoading) return;

    if (!data?.wallets.find_one.contacts.find_one.encryption_pubkey) {
      toast({
        variant: 'default',
        title: 'Unable to send message',
        description: 'No encryption pubkey found for this contact',
      });

      return;
    }

    if (!masterKey) {
      toast({
        variant: 'destructive',
        title: 'Vault Locked',
        description: 'Unlock your vault to send a message',
      });

      return;
    }

    if (!currentContact?.id) {
      toast({
        variant: 'destructive',
        title: 'No Contact Selected',
        description: 'Select a contact to send them a message',
      });

      return;
    }

    sendMessage({
      contact_id: currentContact.id,
      protectedPrivateKey:
        data.wallets.find_one.secp256k1_key_pair
          .protected_encryption_private_key,
      masterKey,
      receiver_pubkey:
        data.wallets.find_one.contacts.find_one.encryption_pubkey,
      receiver_money_address:
        data.wallets.find_one.contacts.find_one.money_address,
      sender_message: message,
      receiver_message: message,
    });
  };

  const isLoading = loading || sendLoading;

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
    >
      <Label htmlFor="message" className="sr-only">
        Message
      </Label>
      <Input
        autoComplete="off"
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Type your message here..."
        className="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0"
      />
      <div className="flex items-center p-3 pt-0">
        {iconOptions}

        {masterKey ? (
          <Button
            type="submit"
            disabled={isLoading}
            size="sm"
            className="ml-auto gap-1.5"
          >
            Send Message
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CornerDownLeft className="size-3.5" />
            )}
          </Button>
        ) : (
          <VaultButton
            lockedTitle="Unlock to Send Message"
            size="sm"
            className="ml-auto gap-1.5"
          />
        )}
      </div>
    </form>
  );
};
