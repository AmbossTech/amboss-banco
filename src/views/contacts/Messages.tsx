import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useGetWalletContactMessagesQuery } from '@/graphql/queries/__generated__/contacts.generated';
import { useContactStore } from '@/stores/contacts';
import { useKeyStore } from '@/stores/keys';
import { cn } from '@/utils/cn';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import {
  CryptoWorkerMessage,
  CryptoWorkerResponse,
} from '@/workers/crypto/types';

import { Views } from './Contacts';
import { MoneySection } from './MoneySection';
import { SendMessageBox } from './SendMessageBox';

type Message = {
  id: string;
  contact_is_sender: boolean;
  message: string;
  created_at: string;
};

export const Messages: FC<{
  contactsLoading: boolean;
  setView: Dispatch<SetStateAction<Views>>;
}> = ({ contactsLoading, setView }) => {
  const { toast } = useToast();

  const scrollDiv = useRef<HTMLDivElement>(null);

  const workerRef = useRef<Worker>();

  const [decryptedMessage, setDecryptedMessage] = useState<Message[]>([]);

  const [workerLoaded, setWorkerLoaded] = useState<boolean>(false);

  const keys = useKeyStore(s => s.keys);

  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const currentContact = useContactStore(s => s.currentContact);

  const { data, loading, error } = useGetWalletContactMessagesQuery({
    variables: { id: value, contact_id: currentContact?.id || '' },
    skip: !currentContact?.id,
    onError: () =>
      toast({
        variant: 'destructive',
        title: 'Error getting messages.',
      }),
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
    if (scrollDiv.current) {
      scrollDiv.current.scrollTop = scrollDiv.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!keys) return;
    if (!workerLoaded) return;
    if (loading || error) return;
    if (!data?.wallets.find_one.contacts.find_one.messages.length) return;

    const { secp256k1_key_pair, contacts } = data.wallets.find_one;

    if (workerRef.current) {
      const workerMessage: CryptoWorkerMessage = {
        type: 'decryptMessages',
        payload: {
          keys,
          messages: contacts.find_one.messages,
          protectedPrivateKey:
            secp256k1_key_pair.protected_encryption_private_key,
        },
      };

      workerRef.current.postMessage(workerMessage);
    }
  }, [loading, error, data, workerLoaded, keys]);

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
    <div className="flex h-[calc(100dvh-127px)] w-full flex-col border-slate-200 dark:border-neutral-800 md:h-[calc(100dvh-106px)] lg:h-[calc(100dvh-114px)] lg:w-2/3 lg:rounded-2xl lg:border lg:p-4">
      {!contactsLoading && !currentContact ? null : (
        <>
          {contactsLoading ? (
            <>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setView('contacts')}
                  className="m-2 transition-opacity hover:opacity-75 lg:hidden"
                >
                  <ArrowLeft size={24} />
                </button>

                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-6 w-28" />
              </div>

              <Skeleton className="mt-6 min-h-10 w-full rounded-xl sm:w-[140px] lg:mt-3" />
            </>
          ) : currentContact ? (
            <>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setView('contacts')}
                  className="m-2 transition-opacity hover:opacity-75 lg:hidden"
                >
                  <ArrowLeft size={24} />
                </button>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-medium uppercase text-black">
                  {currentContact.address.slice(0, 2)}
                </div>

                <p className="break-all font-medium">{currentContact.user}</p>
              </div>

              <MoneySection contactsLoading={contactsLoading} />
            </>
          ) : null}

          <div
            ref={scrollDiv}
            className="my-4 flex w-full flex-grow flex-col space-y-4 overflow-y-auto lg:my-6"
          >
            {messages.map(m => (
              <div
                key={m.id}
                className={cn(
                  'w-2/3 text-wrap break-all rounded-xl px-3 py-2 text-sm text-black dark:text-white',
                  m.contact_is_sender
                    ? 'self-start bg-slate-100 dark:bg-neutral-800'
                    : 'self-end bg-slate-300 dark:bg-[#5C74B7]'
                )}
              >
                {m.message.substring(0, 1) === '{'
                  ? 'Encrypted message'
                  : m.message}

                <p className="mt-1 text-xs text-slate-600 dark:text-white/60">
                  {format(new Date(m.created_at), 'yyyy.MM.dd - HH:mm')}
                </p>
              </div>
            ))}
          </div>

          <SendMessageBox contactsLoading={contactsLoading} />
        </>
      )}
    </div>
  );
};
