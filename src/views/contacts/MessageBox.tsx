'use client';

import { CornerDownLeft, Loader2, Mic, Paperclip } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { useSendMessageMutation } from '@/graphql/mutations/__generated__/contact.generated';
import {
  GetWalletContactMessagesDocument,
  useGetWalletContactQuery,
} from '@/graphql/queries/__generated__/contacts.generated';
import { useContactStore } from '@/stores/contacts';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import {
  CryptoWorkerMessage,
  CryptoWorkerResponse,
} from '@/workers/crypto/types';

export const ContactMessageBox = () => {
  const workerRef = useRef<Worker>();

  const { toast } = useToast();

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
      new URL('../../workers/crypto/crypto.ts', import.meta.url)
    );

    workerRef.current.onmessage = event => {
      const message: CryptoWorkerResponse = event.data;

      switch (message.type) {
        case 'eciesEncrypt':
          if (!currentContact?.id) {
            toast({
              variant: 'destructive',
              title: 'No Contact Selected',
              description: 'Select a contact to send them a message',
            });
          } else {
            const {
              sender_protected_message,
              receiver_lightning_address,
              receiver_protected_message,
            } = message.payload;

            sendMessage({
              variables: {
                input: {
                  contact_id: currentContact.id,
                  receiver_lightning_address,
                  receiver_protected_message,
                  sender_protected_message,
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

    if (workerRef.current) {
      setFormLoading(true);

      const workerMessage: CryptoWorkerMessage = {
        type: 'eciesEncrypt',
        payload: {
          sender_pubkey:
            data.wallets.find_one.secp256k1_key_pair.encryption_pubkey,
          receiver_pubkey:
            data.wallets.find_one.contacts.find_one.encryption_pubkey,
          receiver_lightning_address:
            data.wallets.find_one.contacts.find_one.lightning_address,
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
        id="message"
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Type your message here..."
        className="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0"
      />
      <div className="flex items-center p-3 pt-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <Paperclip className="size-4" />
              <span className="sr-only">Attach file</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Attach File</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <Mic className="size-4" />
              <span className="sr-only">Use Microphone</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Use Microphone</TooltipContent>
        </Tooltip>
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
      </div>
    </form>
  );
};
