'use client';

import { ApolloError, useApolloClient } from '@apollo/client';
import Big from 'big.js';
import {
  CornerDownLeft,
  HandCoins,
  Loader2,
  Mic,
  Paperclip,
} from 'lucide-react';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { VaultButton } from '@/components/button/VaultButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import {
  BroadcastLiquidTransactionDocument,
  BroadcastLiquidTransactionMutation,
  BroadcastLiquidTransactionMutationVariables,
} from '@/graphql/mutations/__generated__/broadcastLiquidTransaction.generated';
import { useSendMessageMutation } from '@/graphql/mutations/__generated__/contact.generated';
import {
  PayLightningAddressDocument,
  PayLightningAddressMutation,
  PayLightningAddressMutationVariables,
} from '@/graphql/mutations/__generated__/pay.generated';
import {
  GetWalletContactMessagesDocument,
  useGetWalletContactQuery,
} from '@/graphql/queries/__generated__/contacts.generated';
import { useContactInfo, useUserInfo } from '@/hooks/user';
import { useWalletInfo } from '@/hooks/wallet';
import { useContactStore } from '@/stores/contacts';
import { useKeyStore } from '@/stores/keys';
import { toWithError } from '@/utils/async';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import { numberWithPrecision } from '@/utils/numbers';
import {
  CryptoWorkerMessage,
  CryptoWorkerResponse,
} from '@/workers/crypto/types';

export const PayMessageBox = () => {
  const workerRef = useRef<Worker>();

  const client = useApolloClient();

  const { toast } = useToast();

  const [loading, setLoading] = useState<boolean>(false);

  const masterKey = useKeyStore(s => s.masterKey);
  const currentContact = useContactStore(s => s.currentContact);

  const walletInfo = useWalletInfo();
  const userInfo = useUserInfo();

  const [inputValue, setInputValue] = useState<{
    number: number;
    formattedNumber: string;
  }>({
    number: 0,
    formattedNumber: '',
  });

  const {
    contact: {
      lnurl_info: {
        active,
        min_sendable,
        max_sendable,
        variable_fee_percentage,
        fixed_fee,
      },
    },
    loading: contactLoading,
  } = useContactInfo();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (loading) return;
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digit characters

    const numberValue = Number(value);

    if (!!max_sendable && numberValue > Number(max_sendable)) {
      setInputValue({
        number: Number(max_sendable),
        formattedNumber: formatNumber(max_sendable),
      });
    } else {
      setInputValue({
        number: numberValue,
        formattedNumber: formatNumber(value),
      });
    }
  };

  const formatNumber = (value: string) => {
    if (value) {
      return numberWithPrecision(value, 0);
    }
    return value;
  };

  const totalFee = useMemo(() => {
    const inputAmount = Math.max(Number(min_sendable || 0), inputValue.number);

    const size = new Big(inputAmount);

    const feePercentage = variable_fee_percentage
      ? new Big(variable_fee_percentage).div(100)
      : new Big(0);

    const variableFee = size.times(feePercentage);

    const fee = fixed_fee ? variableFee.plus(fixed_fee) : variableFee;

    return fee.toNumber();
  }, [min_sendable, inputValue, variable_fee_percentage, fixed_fee]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);

    if (!currentContact?.address) {
      setLoading(false);
      return;
    }

    const [result, error] = await toWithError(
      client.mutate<
        PayLightningAddressMutation,
        PayLightningAddressMutationVariables
      >({
        mutation: PayLightningAddressDocument,
        variables: {
          payInput: {
            wallet_id: walletInfo.id,
          },
          addressInput: {
            address: currentContact.address,
            amount: inputValue.number,
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

    if (
      !result.data?.pay.money_address ||
      !walletInfo.protected_mnemonic ||
      !masterKey
    ) {
      setLoading(false);
      return;
    }

    if (!workerRef.current) {
      setLoading(false);
      return;
    }

    const message: CryptoWorkerMessage = {
      type: 'signPset',
      payload: {
        wallet_account_id: result.data.pay.money_address.wallet_account.id,
        mnemonic: walletInfo.protected_mnemonic,
        descriptor: result.data.pay.money_address.wallet_account.descriptor,
        pset: result.data.pay.money_address.base_64,
        masterKey,
      },
    };

    workerRef.current.postMessage(message);
  };

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
            description: `Money has been sent to this contact.`,
          });

          setInputValue({
            number: 0,
            formattedNumber: '',
          });

          break;
      }

      setLoading(false);
    };

    workerRef.current.onerror = error => {
      console.error('Worker error:', error);
      setLoading(false);
    };

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, [client, toast]);

  const isLoading =
    loading || contactLoading || walletInfo.loading || userInfo.loading;

  return (
    <>
      {active ? (
        <div className="flex flex-wrap items-center gap-1 py-2">
          {totalFee ? (
            <Badge variant="outline">{`Fee: ${numberWithPrecision(totalFee, 0)} sat${totalFee === 1 ? '' : 's'}`}</Badge>
          ) : null}
          {min_sendable ? (
            <Badge variant="outline">{`Min: ${numberWithPrecision(min_sendable, 0)} sat${min_sendable === '1' ? '' : 's'}`}</Badge>
          ) : null}
          {max_sendable ? (
            <Badge variant="outline">{`Max: ${numberWithPrecision(max_sendable, 0)} sat${max_sendable === '1' ? '' : 's'}`}</Badge>
          ) : null}
        </div>
      ) : null}
      <form
        onSubmit={handleSubmit}
        className="relative overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
      >
        <Label htmlFor="message" className="sr-only">
          Message
        </Label>
        <Input
          autoComplete="off"
          value={inputValue.formattedNumber}
          onChange={handleChange}
          placeholder="Type the amount you want to send here..."
          className="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center p-3 pt-0">
          {/* <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" type="button">
                <Paperclip className="size-4" />
                <span className="sr-only">Attach file</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Attach File</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" type="button">
                <Mic className="size-4" />
                <span className="sr-only">Use Microphone</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Use Microphone</TooltipContent>
          </Tooltip> */}
          {masterKey ? (
            <Button
              type="submit"
              disabled={isLoading || !active || !inputValue.number}
              size="sm"
              className="ml-auto gap-1.5"
            >
              Send Money
              {isLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <HandCoins className="size-3.5" />
              )}
            </Button>
          ) : (
            <VaultButton
              lockedTitle="Unlock to Send Money"
              size="sm"
              className="ml-auto gap-1.5"
            />
          )}
        </div>
      </form>
    </>
  );
};

export const SendMessageBox = () => {
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

  console.log(data);

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
              receiver_money_address,
              receiver_protected_message,
            } = message.payload;

            sendMessage({
              variables: {
                input: {
                  contact_id: currentContact.id,
                  receiver_money_address,
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
          receiver_money_address:
            data.wallets.find_one.contacts.find_one.money_address,
          msg: message,
        },
      };

      workerRef.current.postMessage(workerMessage);
    }
  };

  const isLoading = loading || formLoading || sendMessageLoading;

  if (isLoading) {
    return null;
  }

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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" type="button">
              <Paperclip className="size-4" />
              <span className="sr-only">Attach file</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Attach File</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" type="button">
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

export const ContactMessageBox = () => {
  return (
    <>
      <PayMessageBox />
      {/* <SendMessageBox /> */}
    </>
  );
};
