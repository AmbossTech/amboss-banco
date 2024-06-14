'use client';

import { ApolloError, useApolloClient } from '@apollo/client';
import Big from 'big.js';
import { HandCoins, Loader2 } from 'lucide-react';
import {
  ChangeEvent,
  FC,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { VaultButton } from '@/components/button/VaultButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  BroadcastLiquidTransactionDocument,
  BroadcastLiquidTransactionMutation,
  BroadcastLiquidTransactionMutationVariables,
} from '@/graphql/mutations/__generated__/broadcastLiquidTransaction.generated';
import {
  PayLightningAddressDocument,
  PayLightningAddressMutation,
  PayLightningAddressMutationVariables,
} from '@/graphql/mutations/__generated__/pay.generated';
import { useContactInfo } from '@/hooks/user';
import { useWalletInfo } from '@/hooks/wallet';
import { PaymentOption, useChat, useContactStore } from '@/stores/contacts';
import { useKeyStore } from '@/stores/keys';
import { toWithError } from '@/utils/async';
import { handleApolloError } from '@/utils/error';
import { numberWithPrecision } from '@/utils/numbers';
import {
  CryptoWorkerMessage,
  CryptoWorkerResponse,
} from '@/workers/crypto/types';

const formatNumber = (value: string) => {
  return value ? numberWithPrecision(value, 0) : value;
};

export const PayMessageBox: FC<{
  iconOptions?: ReactNode;
  currentPaymentOption: PaymentOption;
}> = ({ currentPaymentOption, iconOptions }) => {
  const workerRef = useRef<Worker>();

  const client = useApolloClient();

  const { toast } = useToast();

  const [loading, setLoading] = useState<boolean>(false);

  const masterKey = useKeyStore(s => s.masterKey);
  const currentContact = useContactStore(s => s.currentContact);

  const setCurrentPaymentOption = useChat(s => s.setCurrentPaymentOption);

  const walletInfo = useWalletInfo();

  const [inputValue, setInputValue] = useState<{
    number: number;
    formattedNumber: string;
  }>({
    number: 0,
    formattedNumber: '',
  });

  const {
    contact: { payment_options },
    loading: contactLoading,
  } = useContactInfo();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (loading) return;

    const value = e.target.value.replace(/\D/g, ''); // Remove non-digit characters

    const numberValue = Number(value);

    const { max_sendable } = currentPaymentOption;

    if (!!max_sendable && numberValue > Number(max_sendable)) {
      setInputValue({
        number: Number(max_sendable),
        formattedNumber: formatNumber(max_sendable + ''),
      });
    } else {
      setInputValue({
        number: numberValue,
        formattedNumber: formatNumber(value),
      });
    }
  };

  const totalFee = useMemo(() => {
    const { min_sendable, variable_fee_percentage, fixed_fee } =
      currentPaymentOption;

    const inputAmount = Math.max(Number(min_sendable || 0), inputValue.number);

    const size = new Big(inputAmount);

    const feePercentage = variable_fee_percentage
      ? new Big(variable_fee_percentage).div(100)
      : new Big(0);

    const variableFee = size.times(feePercentage);

    const fee = fixed_fee ? variableFee.plus(fixed_fee) : variableFee;

    return fee.toNumber();
  }, [inputValue, currentPaymentOption]);

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
      new URL('../../../workers/crypto/crypto.ts', import.meta.url)
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

  const isLoading = loading || contactLoading || walletInfo.loading;

  return (
    <>
      <div className="flex flex-wrap items-center gap-1 py-2">
        {totalFee ? (
          <Badge variant="outline">{`Fee: ${numberWithPrecision(totalFee, 0)} sat${totalFee === 1 ? '' : 's'}`}</Badge>
        ) : null}
        {currentPaymentOption?.min_sendable ? (
          <Badge variant="outline">{`Min: ${numberWithPrecision(currentPaymentOption.min_sendable, 0)} sat${currentPaymentOption.min_sendable === 1 ? '' : 's'}`}</Badge>
        ) : null}
        {currentPaymentOption?.max_sendable ? (
          <Badge variant="outline">{`Max: ${numberWithPrecision(currentPaymentOption.max_sendable, 0)} sat${currentPaymentOption.max_sendable === 1 ? '' : 's'}`}</Badge>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
      >
        <div className="flex">
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

          {payment_options.length > 1 ? (
            <Select
              value={currentPaymentOption.id}
              onValueChange={value => {
                const paymentOption = payment_options.find(p => p.id === value);

                if (!paymentOption) return;

                const {
                  id,
                  code,
                  name,
                  network,
                  symbol,
                  max_sendable,
                  min_sendable,
                  fixed_fee,
                  variable_fee_percentage,
                } = paymentOption;

                setCurrentPaymentOption({
                  id,
                  code,
                  name,
                  network,
                  symbol,
                  min_sendable: min_sendable ? Number(min_sendable) : null,
                  max_sendable: max_sendable ? Number(max_sendable) : null,
                  fixed_fee: Number(fixed_fee),
                  variable_fee_percentage: Number(variable_fee_percentage),
                });
              }}
            >
              <SelectTrigger className="m-3 h-8 w-[140px] py-0">
                <SelectValue placeholder={'Currency'} />
              </SelectTrigger>
              <SelectContent>
                {payment_options.map(c => (
                  <SelectItem
                    key={c.id}
                    value={c.id}
                    className="cursor-pointer"
                  >
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>

        <div className="flex items-center p-3 pt-0">
          {iconOptions}

          {masterKey ? (
            <Button
              type="submit"
              disabled={
                isLoading || !currentPaymentOption || !inputValue.number
              }
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
