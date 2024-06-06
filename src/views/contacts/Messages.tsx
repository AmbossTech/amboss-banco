import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Badge } from '@/components/ui/badge';
import { useGetWalletContactMessagesQuery } from '@/graphql/queries/__generated__/contacts.generated';
import { useUserQuery } from '@/graphql/queries/__generated__/user.generated';
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
};

export const Messages = () => {
  const workerRef = useRef<Worker>();

  const [unecryptedMessage, setUnencryptedMessage] = useState<Message[]>([]);

  const [workerLoaded, setWorkerLoaded] = useState<boolean>(false);

  const masterKey = useKeyStore(s => s.masterKey);

  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const currentContact = useContactStore(s => s.currentContact);

  const { data: userData, loading: userLoading } = useUserQuery({
    onError: err => console.log('ERROR', err),
  });

  const { data, loading, error } = useGetWalletContactMessagesQuery({
    variables: { id: value, contact_id: currentContact?.id || '' },
    skip: !currentContact?.id,
  });

  const messages = useMemo(() => {
    if (!data?.wallets.find_one.contacts.find_one.messages.length) return [];
    if (unecryptedMessage.length) return unecryptedMessage;

    return data.wallets.find_one.contacts.find_one.messages.map(m => ({
      id: m.id,
      contact_is_sender: m.contact_is_sender,
      message: m.protected_message,
    }));
  }, [unecryptedMessage, data]);

  useEffect(() => {
    if (!masterKey) return;
    if (!workerLoaded) return;
    if (loading || error) return;
    if (!userData?.user.symmetric_key_iv || userLoading) return;
    if (!data?.wallets.find_one.contacts.find_one.messages.length) return;

    const { secp256k1_key_pair, contacts } = data.wallets.find_one;

    if (workerRef.current) {
      const workerMessage: CryptoWorkerMessage = {
        type: 'decryptMessages',
        payload: {
          masterKey,
          iv: userData.user.symmetric_key_iv,
          messages: contacts.find_one.messages,
          protectedPrivateKey:
            secp256k1_key_pair.protected_encryption_private_key,
        },
      };

      workerRef.current.postMessage(workerMessage);
    }
  }, [loading, error, data, workerLoaded, userData, masterKey, userLoading]);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../../workers/crypto/crypto.ts', import.meta.url)
    );

    workerRef.current.onmessage = event => {
      const message: CryptoWorkerResponse = event.data;

      switch (message.type) {
        case 'decryptMessages':
          setUnencryptedMessage(message.payload);
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
              'w-2/3 text-wrap break-words rounded p-4',
              m.contact_is_sender ? 'self-start' : 'self-end',
              m.contact_is_sender
                ? 'bg-purple-100 dark:bg-purple-700'
                : 'bg-purple-200 dark:bg-purple-950'
            )}
          >
            {m.message}
          </div>
        ))}
      </div>
      <ContactMessageBox />
    </div>
  );
};
