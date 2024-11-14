'use client';

import { ApolloError, useApolloClient } from '@apollo/client';
import { ArrowUp, ArrowUpDown, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button-v2';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
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
import { useGetPriceCurrentQuery } from '@/graphql/queries/__generated__/prices.generated';
import { PaymentOptionCode } from '@/graphql/types';
import { useSendMessage } from '@/hooks/message';
import { useContactInfo } from '@/hooks/user';
import { useWalletInfo } from '@/hooks/wallet';
import { PaymentOption, useChat, useContactStore } from '@/stores/contacts';
import { useKeyStore } from '@/stores/keys';
import { toWithError } from '@/utils/async';
import { cn } from '@/utils/cn';
import { handleApolloError } from '@/utils/error';
import { cryptoToUsd, formatFiat } from '@/utils/fiat';
import {
  numberWithoutPrecision,
  numberWithPrecisionAndDecimals,
} from '@/utils/numbers';
import {
  CryptoWorkerMessage,
  CryptoWorkerResponse,
} from '@/workers/crypto/types';

const formatNumber = (value: number, ticker: PaymentOptionCode) => {
  const minimumFractionDigits = ticker === PaymentOptionCode.Usdt ? 2 : 0;

  return value.toLocaleString('en-US', { minimumFractionDigits });
};

export const PayButton: FC<{
  currentPaymentOption: PaymentOption;
}> = ({ currentPaymentOption }) => {
  const t = useTranslations();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [satsFirst, setSatsFirst] = useState(false);
  const [amountUSDInput, setAmountUSDInput] = useState('');
  const [amountSatsInput, setAmountSatsInput] = useState('');

  useEffect(() => {
    if (currentPaymentOption.name === 'Tether USD') {
      setSatsFirst(false);
    }
  }, [currentPaymentOption.name]);

  const { data: priceData } = useGetPriceCurrentQuery({
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error getting asset prices.',
        description: messages.join(', '),
      });
    },
  });

  const latestPrice = priceData?.prices.current.value;

  const workerRef = useRef<Worker>();
  const client = useApolloClient();
  const keys = useKeyStore(s => s.keys);

  const currentContact = useContactStore(s => s.currentContact);
  const setCurrentPaymentOption = useChat(s => s.setCurrentPaymentOption);

  const walletInfo = useWalletInfo();
  const currentAsset = walletInfo.getLiquidAssetByCode(
    currentPaymentOption.code === PaymentOptionCode.Lightning
      ? PaymentOptionCode.Btc
      : currentPaymentOption.code
  );

  const {
    protected_encryption_private_key,
    contact: { payment_options, encryption_pubkey, money_address },
    loading: contactLoading,
  } = useContactInfo();

  const cbk = useCallback(() => {
    setOpen(false);
    setLoading(false);
  }, []);

  const { sendMessage, loading: sendLoading } = useSendMessage(cbk);

  const isLoading =
    loading || contactLoading || walletInfo.loading || sendLoading;

  const startPayment = async () => {
    if (!currentContact?.address || !currentAsset) return;

    setLoading(true);

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
            amount:
              currentAsset.asset_info.ticker === 'USDT'
                ? Number(amountUSDInput) * 100_000_000
                : Number(amountSatsInput),
            payment_option: {
              code: currentPaymentOption.code,
              network: currentPaymentOption.network,
            },
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
      !keys ||
      !workerRef.current
    ) {
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
        keys,
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

          if (!currentContact?.id || !keys || !money_address || !currentAsset) {
            cbk();

            toast({
              title: 'Money Sent!',
              description: `Money has been sent to this contact.`,
            });
            return;
          }

          const fiatAmount = cryptoToUsd(
            numberWithoutPrecision(
              currentAsset.asset_info.ticker === 'USDT'
                ? amountUSDInput
                : amountSatsInput,
              currentAsset.asset_info.precision
            ) || '0',
            currentAsset.asset_info.precision,
            currentAsset.asset_info.ticker,
            currentAsset.fiat_info.fiat_to_btc
          );

          const amount = `${formatNumber(Number(currentAsset.asset_info.ticker === 'USDT' ? amountUSDInput : amountSatsInput), currentPaymentOption.code)} ${currentAsset.asset_info.ticker === 'USDT' ? 'USDT' : 'sats'}`;

          toast({
            title: 'Money Sent!',
            description: `You sent ${fiatAmount} in ${currentPaymentOption.name}.`,
          });

          sendMessage({
            contact_id: currentContact.id,
            protectedPrivateKey: protected_encryption_private_key,
            keys,
            receiver_pubkey: encryption_pubkey,
            receiver_money_address: money_address,
            message: `${fiatAmount} (${amount})`,
          });

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
  }, [
    client,
    toast,
    currentContact,
    keys,
    sendMessage,
    encryption_pubkey,
    money_address,
    protected_encryption_private_key,
    currentAsset,
    amountUSDInput,
    amountSatsInput,
    currentPaymentOption,
    cbk,
  ]);

  return (
    <Drawer
      open={open}
      onOpenChange={open => {
        if (isLoading) return;

        setOpen(open);

        if (!open) {
          setTimeout(() => {
            setSatsFirst(false);
            setAmountUSDInput('');
            setAmountSatsInput('');
          }, 1000);
        }
      }}
    >
      <DrawerTrigger asChild>
        <Button
          disabled={isLoading}
          className="mt-6 flex w-full items-center justify-center space-x-2 sm:w-[140px] lg:mt-3"
        >
          <p>{t('App.Contacts.pay')}</p>
          <ArrowUp size={16} />
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <div className="mx-auto mb-6 flex w-fit rounded-2xl bg-slate-200 p-1 dark:bg-neutral-800">
          {payment_options.map(p => (
            <button
              key={p.id}
              onClick={() => {
                const {
                  id,
                  code,
                  name,
                  network,
                  symbol,
                  max_sendable,
                  min_sendable,
                  decimals,
                  fixed_fee,
                  variable_fee_percentage,
                } = p;

                setCurrentPaymentOption({
                  id,
                  name,
                  code,
                  network,
                  symbol,
                  min_sendable: min_sendable ? Number(min_sendable) : null,
                  max_sendable: max_sendable ? Number(max_sendable) : null,
                  decimals,
                  fixed_fee: Number(fixed_fee),
                  variable_fee_percentage: Number(variable_fee_percentage),
                });
              }}
              disabled={
                isLoading ||
                payment_options.length === 1 ||
                currentPaymentOption.id === p.id
              }
              className={cn(
                'rounded-xl px-4 py-1.5 font-semibold transition-colors',
                currentPaymentOption.id === p.id
                  ? 'bg-slate-300 dark:bg-neutral-700'
                  : 'text-foreground/60'
              )}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="relative mb-4 border-b border-primary pb-px">
          <input
            autoFocus
            id="amount"
            type="number"
            placeholder="0"
            value={satsFirst ? amountSatsInput : amountUSDInput}
            onChange={e => {
              if (!latestPrice) return;

              const numberValue = Number(e.target.value);
              const decimals = e.target.value.split('.')[1];
              const latestPricePerSat = latestPrice / 100_000_000;

              if (!e.target.value) {
                setAmountUSDInput('');
                setAmountSatsInput('');
                return;
              }

              if (numberValue < 0) return;
              if (satsFirst && numberValue < 1) return;
              if (satsFirst && e.target.value.includes('.')) return;
              if (!satsFirst && decimals?.length > 2) return;

              if (satsFirst) {
                setAmountSatsInput(numberValue.toFixed(0));
                setAmountUSDInput((latestPricePerSat * numberValue).toFixed(2));
              } else {
                setAmountUSDInput(e.target.value);
                setAmountSatsInput(
                  (numberValue / latestPricePerSat).toFixed(0)
                );
              }
            }}
            disabled={!latestPrice || isLoading}
            className="w-full bg-transparent text-center text-5xl font-medium focus:outline-none"
          />

          <label
            htmlFor="amount"
            className="absolute right-0 top-0 flex h-[62px] items-center justify-center bg-slate-100 pl-2 text-sm dark:bg-neutral-900"
          >
            {satsFirst ? 'SATS' : 'USD'}
          </label>
        </div>

        <div className="mb-4 flex items-center justify-center space-x-2 text-slate-600 dark:text-neutral-400">
          <p className="overflow-x-auto whitespace-nowrap">
            {currentPaymentOption.name !== 'Tether USD'
              ? satsFirst
                ? formatFiat(Number(amountUSDInput)) + ' USD'
                : Number(amountSatsInput).toLocaleString('en-US') + ' sats'
              : formatFiat(Number(amountUSDInput)).slice(1) + ' USDT'}
          </p>

          {currentPaymentOption.name !== 'Tether USD' ? (
            <button
              onClick={() => {
                setSatsFirst(s => !s);

                if (amountUSDInput) {
                  setAmountUSDInput(a => Number(a).toFixed(2));
                }
              }}
            >
              <ArrowUpDown size={16} className="shrink-0" />
            </button>
          ) : null}
        </div>

        <div className="mb-6 text-sm text-slate-600 dark:text-neutral-400">
          <div className="flex flex-wrap justify-center gap-4">
            <p>
              {t('App.Wallet.available')}:{' '}
              {currentAsset
                ? numberWithPrecisionAndDecimals(
                    currentAsset.balance || 0,
                    currentAsset.asset_info.precision || 0,
                    currentAsset.asset_info.ticker
                  ) +
                  (currentAsset.asset_info.ticker === 'USDT'
                    ? ' USDT'
                    : ' sats')
                : '-'}
            </p>

            <p>{t('App.Wallet.fee')}: Unknown</p>
          </div>

          {currentPaymentOption.min_sendable ||
          currentPaymentOption.max_sendable ? (
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {currentPaymentOption.min_sendable ? (
                <p>
                  {t('App.Contacts.min')}:{' '}
                  {numberWithPrecisionAndDecimals(
                    currentPaymentOption.min_sendable,
                    0
                  ) + ' sats'}
                </p>
              ) : null}

              {currentPaymentOption.max_sendable ? (
                <p>
                  {t('App.Contacts.max')}:{' '}
                  {numberWithPrecisionAndDecimals(
                    currentPaymentOption.max_sendable,
                    0
                  ) + ' sats'}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <Button
          onClick={() => startPayment()}
          disabled={!Number(amountSatsInput) || isLoading}
          className="flex w-full items-center justify-center space-x-2"
        >
          {loading || sendLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-black" />
          ) : null}

          <p>{t('App.Wallet.send')}</p>
        </Button>
      </DrawerContent>
    </Drawer>
  );
};
