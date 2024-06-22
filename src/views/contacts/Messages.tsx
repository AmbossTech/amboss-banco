import { format } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Badge } from '@/components/ui/badge';
import { useGetWalletContactMessagesQuery } from '@/graphql/queries/__generated__/contacts.generated';
import { cn } from '@/lib/utils';
import { useContactStore } from '@/stores/contacts';
import { useKeyStore } from '@/stores/keys';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import {
  CryptoWorkerMessage,
  CryptoWorkerResponse,
} from '@/workers/crypto/types';

import { ContactMessageBox } from './MessageBox';

type Message = {
  id: string;
  contact_is_sender: boolean;
  message: string;
  created_at: string;
};

export const Messages = () => {
  const workerRef = useRef<Worker>();

  const [decryptedMessage, setDecryptedMessage] = useState<Message[]>([]);

  const [workerLoaded, setWorkerLoaded] = useState<boolean>(false);

  const masterKey = useKeyStore(s => s.masterKey);

  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const currentContact = useContactStore(s => s.currentContact);

  const { data, loading, error } = useGetWalletContactMessagesQuery({
    variables: { id: value, contact_id: currentContact?.id || '' },
    skip: !currentContact?.id,
  });

  const messages = useMemo(() => {
    if (!data?.wallets.find_one.contacts.find_one.messages.length) return [];
    if (decryptedMessage.length) return decryptedMessage;

    return data.wallets.find_one.contacts.find_one.messages.map(m => ({
      id: m.id,
      contact_is_sender: m.contact_is_sender,
      message: m.payload,
      created_at: m.created_at,
    }));
  }, [decryptedMessage, data]);

  useEffect(() => {
    if (!masterKey) return;
    if (!workerLoaded) return;
    if (loading || error) return;
    if (!data?.wallets.find_one.contacts.find_one.messages.length) return;

    const { secp256k1_key_pair, contacts } = data.wallets.find_one;

    if (workerRef.current) {
      const workerMessage: CryptoWorkerMessage = {
        type: 'decryptMessages',
        payload: {
          masterKey,
          messages: contacts.find_one.messages,
          protectedPrivateKey:
            secp256k1_key_pair.protected_encryption_private_key,
        },
      };

      workerRef.current.postMessage(workerMessage);
    }
  }, [loading, error, data, workerLoaded, masterKey]);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../../workers/crypto/crypto.ts', import.meta.url)
    );

    workerRef.current.onmessage = event => {
      const message: CryptoWorkerResponse = event.data;

      switch (message.type) {
        case 'decryptMessages':
          setDecryptedMessage(message.payload);
          break;

        case 'loaded':
          setWorkerLoaded(true);
          break;
      }
    };

    workerRef.current.onerror = error => {
      console.error('Worker error:', error);
    };

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  return (
    <div className="relative flex h-full min-h-[50vh] flex-col rounded-xl bg-muted/50 p-4 lg:col-span-3">
      {!!currentContact?.user ? (
        <Badge variant="secondary" className="absolute right-3 top-3">
          {currentContact.user}
        </Badge>
      ) : null}
      <div className="flex-1" />
      <div className="my-8 flex flex-col gap-4">
        {messages.map(m => (
          <div
            key={m.id}
            className={cn(
              'w-2/3 text-wrap break-words rounded p-4 text-sm',
              m.contact_is_sender ? 'self-start' : 'self-end',
              m.contact_is_sender
                ? 'bg-purple-100 dark:bg-purple-700'
                : 'bg-purple-200 dark:bg-purple-950'
            )}
          >
            {m.message.substring(0, 1) === '{'
              ? 'Encrypted message'
              : m.message}
            <p className="mt-2 text-xs text-muted-foreground">
              {format(new Date(m.created_at), 'yyyy.MM.dd - HH:mm')}
            </p>
          </div>
        ))}
      </div>
      <ContactMessageBox />
    </div>
  );
};
