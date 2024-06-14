'use client';

import { CornerDownLeft, Loader2 } from 'lucide-react';
import { FC, ReactNode, useEffect, useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { VaultButton } from '@/components/button/VaultButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useSendMessageMutation } from '@/graphql/mutations/__generated__/contact.generated';
import {
  GetWalletContactMessagesDocument,
  useGetWalletContactQuery,
} from '@/graphql/queries/__generated__/contacts.generated';
import { useContactStore } from '@/stores/contacts';
import { useKeyStore } from '@/stores/keys';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import {
  CryptoWorkerMessage,
  CryptoWorkerResponse,
} from '@/workers/crypto/types';

export const SendMessageBox: FC<{ iconOptions?: ReactNode }> = ({
  iconOptions,
}) => {
  const workerRef = useRef<Worker>();

  const { toast } = useToast();

  const masterKey = useKeyStore(s => s.masterKey);

  const [message, setMessage] = useState<string>('');
  const [formLoading, setFormLoading] = useState<boolean>(false);

  const currentContact = useContactStore(s => s.currentContact);

  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const [sendMessage, { loading: sendMessageLoading }] = useSendMessageMutation(
    {
      onCompleted: () => {
        setMessage('');
      },
      onError: err => {
        const messages = handleApolloError(err);

        toast({
          variant: 'destructive',
          title: 'Error Sending Message',
          description: messages.join(', '),
        });
      },
      refetchQueries: [
        {
          query: GetWalletContactMessagesDocument,
          variables: { id: value, contact_id: currentContact?.id || '' },
        },
      ],
    }
  );

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

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../../../workers/crypto/crypto.ts', import.meta.url)
    );

    workerRef.current.onmessage = event => {
      const message: CryptoWorkerResponse = event.data;

      switch (message.type) {
        case 'encryptMessage':
          if (!currentContact?.id) {
            toast({
              variant: 'destructive',
              title: 'No Contact Selected',
              description: 'Select a contact to send them a message',
            });
          } else {
            const { sender_payload, receiver_money_address, receiver_payload } =
              message.payload;

            sendMessage({
              variables: {
                input: {
                  contact_id: currentContact.id,
                  receiver_money_address,
                  receiver_payload,
                  sender_payload,
                },
              },
            });
          }
          break;
      }

      setFormLoading(false);
    };

    workerRef.current.onerror = error => {
      console.error('Worker error:', error);
      setFormLoading(false);
    };

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, [sendMessage, currentContact, toast]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!data?.wallets.find_one.contacts.find_one.encryption_pubkey) {
      toast({
        variant: 'default',
        title: 'Unable to send message',
        description: 'No encryption pubkey found for this contact',
      });

      return;
    }

    if (!masterKey) return;

    if (workerRef.current) {
      setFormLoading(true);

      const workerMessage: CryptoWorkerMessage = {
        type: 'encryptMessage',
        payload: {
          protectedPrivateKey:
            data.wallets.find_one.secp256k1_key_pair
              .protected_encryption_private_key,
          masterKey,
          receiver_pubkey:
            data.wallets.find_one.contacts.find_one.encryption_pubkey,
          receiver_money_address:
            data.wallets.find_one.contacts.find_one.money_address,
          msg: message,
        },
      };

      workerRef.current.postMessage(workerMessage);
    }
  };

  const isLoading = loading || formLoading || sendMessageLoading;

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
