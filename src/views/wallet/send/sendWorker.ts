import { ApolloError, useApolloClient } from '@apollo/client';
import { Dispatch, SetStateAction, useEffect, useRef } from 'react';

import { useToast } from '@/components/ui/use-toast';
import {
  BroadcastLiquidTransactionDocument,
  BroadcastLiquidTransactionMutation,
  BroadcastLiquidTransactionMutationVariables,
} from '@/graphql/mutations/__generated__/broadcastLiquidTransaction.generated';
import { toWithError } from '@/utils/async';
import { handleApolloError } from '@/utils/error';
import { CryptoWorkerResponse } from '@/workers/crypto/types';

export const useSendWorker = (
  setLoading: Dispatch<SetStateAction<boolean>>,
  setView: Dispatch<SetStateAction<'default' | 'sent' | 'confirm'>>
) => {
  const workerRef = useRef<Worker>();
  const client = useApolloClient();
  const { toast } = useToast();

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../../workers/crypto/crypto.ts', import.meta.url)
    );

    workerRef.current.onmessage = async event => {
      const message: CryptoWorkerResponse = event.data;

      switch (message.type) {
        case 'signPset':
          const [, error] = await toWithError(
            client.mutate<
              BroadcastLiquidTransactionMutation,
              BroadcastLiquidTransactionMutationVariables
            >({
              mutation: BroadcastLiquidTransactionDocument,
              variables: {
                input: {
                  wallet_account_id: message.payload.wallet_account_id,
                  signed_pset: message.payload.signedPset,
                },
              },
            })
          );

          if (error) {
            const messages = handleApolloError(error as ApolloError);

            toast({
              variant: 'destructive',
              title: 'Error Sending Money',
              description: messages.join(', '),
            });

            setLoading(false);
            return;
          }

          toast({
            title: 'Money Sent!',
            description: `Money has been sent.`,
          });

          setLoading(false);
          setView('sent');
          break;

        case 'error':
          toast({
            variant: 'destructive',
            title: 'Error Sending Money',
            description: message.msg,
          });

          setLoading(false);
          break;
      }
    };

    workerRef.current.onerror = error => {
      console.error('Worker error:', error);
      setLoading(false);
    };

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, [client, toast, setLoading, setView]);

  return workerRef;
};
