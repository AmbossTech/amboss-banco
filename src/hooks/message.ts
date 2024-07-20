import { ApolloError, useApolloClient } from '@apollo/client';
import { useEffect, useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { useToast } from '@/components/ui/use-toast';
import {
  SendMessageDocument,
  SendMessageMutation,
  SendMessageMutationVariables,
} from '@/graphql/mutations/__generated__/contact.generated';
import { GetWalletContactMessagesDocument } from '@/graphql/queries/__generated__/contacts.generated';
import { KeysType } from '@/stores/keys';
import { toWithError } from '@/utils/async';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import {
  CryptoWorkerMessage,
  CryptoWorkerResponse,
} from '@/workers/crypto/types';

export const useSendMessage = (cbk: () => void) => {
  const workerRef = useRef<Worker>();
  const client = useApolloClient();

  const { toast } = useToast();

  const [loading, setLoading] = useState<boolean>(true);

  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/crypto/crypto.ts', import.meta.url)
    );

    workerRef.current.onmessage = async event => {
      const message: CryptoWorkerResponse = event.data;

      switch (message.type) {
        case 'encryptMessage':
          const {
            sender_payload,
            receiver_money_address,
            receiver_payload,
            contact_id,
          } = message.payload;

          const [, error] = await toWithError(
            client.mutate<SendMessageMutation, SendMessageMutationVariables>({
              mutation: SendMessageDocument,
              variables: {
                input: {
                  contact_id,
                  receiver_money_address,
                  receiver_payload,
                  sender_payload,
                },
              },
              refetchQueries: [
                {
                  query: GetWalletContactMessagesDocument,
                  variables: {
                    id: value,
                    contact_id,
                  },
                },
              ],
            })
          );

          if (error) {
            const messages = handleApolloError(error as ApolloError);
            toast({
              variant: 'default',
              title: 'Unable to send message.',
              description: messages.join(', '),
            });
          }

          cbk();

          break;

        case 'loaded':
          setLoading(false);
      }

      setLoading(false);
    };

    workerRef.current.onerror = error => {
      console.error('Worker error:', error);
      cbk();
      setLoading(false);
    };

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, [client, toast, value, cbk]);

  const sendMessage = async ({
    contact_id,
    keys,
    protectedPrivateKey,
    receiver_pubkey,
    receiver_money_address,
    message,
  }: {
    contact_id: string;
    keys: KeysType;
    protectedPrivateKey: string;
    receiver_pubkey: string | undefined | null;
    receiver_money_address: string;
    message: string;
  }) => {
    if (loading) return;

    if (workerRef.current) {
      setLoading(true);

      const workerMessage: CryptoWorkerMessage = {
        type: 'encryptMessage',
        payload: {
          contact_id,
          protectedPrivateKey,
          keys,
          receiver_pubkey,
          receiver_money_address,
          message,
        },
      };

      workerRef.current.postMessage(workerMessage);
    }
  };

  return { sendMessage, loading };
};
