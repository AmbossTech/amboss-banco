import { ApolloError, useApolloClient } from '@apollo/client';
import { Scanner } from '@yudiel/react-qr-scanner';
import bolt11 from 'bolt11';
import {
  ArrowLeft,
  ArrowUpDown,
  ChevronsUpDown,
  Loader2,
  Lock,
  ScanText,
  SquareArrowOutUpRight,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import success from '/public/icons/success.svg';
import { Button } from '@/components/ui/button-v2';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  PayLightningInvoiceDocument,
  PayLightningInvoiceMutation,
  PayLightningInvoiceMutationVariables,
  PayLiquidAddressDocument,
  PayLiquidAddressMutation,
  PayLiquidAddressMutationVariables,
} from '@/graphql/mutations/__generated__/pay.generated';
import { useGetWalletContactsQuery } from '@/graphql/queries/__generated__/contacts.generated';
import { useGetPriceCurrentQuery } from '@/graphql/queries/__generated__/prices.generated';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { PaymentOptionCode, PaymentOptionNetwork } from '@/graphql/types';
import { useKeyStore } from '@/stores/keys';
import { toWithError } from '@/utils/async';
import { cn } from '@/utils/cn';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import { cryptoToUsd, formatFiat } from '@/utils/fiat';
import { ROUTES } from '@/utils/routes';
import { shorten } from '@/utils/string';
import {
  CryptoWorkerMessage,
  CryptoWorkerResponse,
} from '@/workers/crypto/types';

type Assets = 'Liquid Bitcoin' | 'Tether USD';

const checkSendString = (str: string) => {
  switch (true) {
    case str.includes('@'):
      return str.split('@')[1] === 'bancolibre.com'
        ? 'miban'
        : 'lightning-address';
    case str.startsWith('lnbc'):
      return 'invoice';
    case str.startsWith('lq'):
    case str.startsWith('liquid:'):
      return 'liquid';
  }
};

const assets: Assets[] = ['Liquid Bitcoin', 'Tether USD'];

export const Send = () => {
  const t = useTranslations();
  const workerRef = useRef<Worker>();
  const client = useApolloClient();
  const { toast } = useToast();

  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');
  const keys = useKeyStore(s => s.keys);

  const [view, setView] = useState<'default' | 'confirm' | 'sent'>('default');
  const [showScanner, setShowScanner] = useState(false);
  const [sendString, setSendString] = useState('');
  const [sendType, setSendType] = useState<
    'miban' | 'lightning-address' | 'invoice' | 'liquid'
  >();
  const [invoiceNode, setInvoiceNode] = useState('');
  const [asset, setAsset] = useState<Assets>('Liquid Bitcoin');
  const [selectAsset, setSelectAsset] = useState(false);
  const [amountUSDInput, setAmountUSDInput] = useState('');
  const [amountSatsInput, setAmountSatsInput] = useState('');
  const [satsFirst, setSatsFirst] = useState(false);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setView('default');
    setSendString('');
    setSendType(undefined);
    setInvoiceNode('');
    setAsset('Liquid Bitcoin');
    setAmountUSDInput('');
    setAmountSatsInput('');
    setSatsFirst(false);
  };

  const recipient = useMemo(() => {
    switch (sendType) {
      case 'miban':
      case 'lightning-address':
        return sendString;
      case 'invoice':
        return shorten(invoiceNode);
      case 'liquid':
        return shorten(sendString);
    }
  }, [sendType, sendString, invoiceNode]);

  const { data: contactsData, loading: contactsLoading } =
    useGetWalletContactsQuery({
      variables: { id: value },
      onError: err => {
        const messages = handleApolloError(err);

        toast({
          variant: 'destructive',
          title: 'Error getting contacts.',
          description: messages.join(', '),
        });
      },
    });

  const contacts = contactsData?.wallets.find_one.contacts.find_many;

  const { data: walletData } = useGetWalletQuery({
    variables: { id: value },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error getting wallet.',
        description: messages.join(', '),
      });
    },
  });

  const liquidAccountId = useMemo(
    () => walletData?.wallets.find_one.accounts.find(a => a.liquid)?.id || '',
    [walletData?.wallets.find_one.accounts]
  );

  const liquidAssetId = useMemo(
    () =>
      walletData?.wallets.find_one.accounts
        .find(a => a.liquid)
        ?.liquid?.assets.find(a => a.asset_info.name === asset)?.asset_id || '',
    [walletData?.wallets.find_one.accounts, asset]
  );

  const balance = useMemo(() => {
    const liquidAsset = walletData?.wallets.find_one.accounts
      .find(a => a.liquid)
      ?.liquid?.assets.find(a => a.asset_info.name === asset);

    if (!liquidAsset) return '-';

    const fiatBalance = cryptoToUsd(
      liquidAsset.balance,
      liquidAsset.asset_info.precision,
      liquidAsset.asset_info.ticker,
      liquidAsset.fiat_info.fiat_to_btc
    );

    return fiatBalance;
  }, [walletData, asset]);

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

  const payLightningInvoice = async () => {
    if (!workerRef.current) {
      return;
    }

    setLoading(true);

    const [result, error] = await toWithError(
      client.mutate<
        PayLightningInvoiceMutation,
        PayLightningInvoiceMutationVariables
      >({
        mutation: PayLightningInvoiceDocument,
        variables: {
          invoiceInput: {
            invoice: sendString,
          },
          payInput: {
            account_id: liquidAccountId,
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

    const invoice = result.data?.pay.lightning_invoice;
    const protectedMnemonic =
      walletData?.wallets.find_one.details.protected_mnemonic;

    if (!invoice || !protectedMnemonic || !keys) {
      setLoading(false);
      return;
    }

    const message: CryptoWorkerMessage = {
      type: 'signPset',
      payload: {
        wallet_account_id: invoice.wallet_account.id,
        mnemonic: protectedMnemonic,
        descriptor: invoice.wallet_account.descriptor,
        pset: invoice.base_64,
        keys,
      },
    };

    workerRef.current.postMessage(message);
  };

  const payLiquidAddress = async () => {
    if (!workerRef.current) {
      return;
    }

    if (!liquidAssetId) {
      toast({
        variant: 'destructive',
        title: 'Error Sending Money',
        description: 'Could not find asset ID.',
      });
      return;
    }

    setLoading(true);

    const [result, error] = await toWithError(
      client.mutate<
        PayLiquidAddressMutation,
        PayLiquidAddressMutationVariables
      >({
        mutation: PayLiquidAddressDocument,
        variables: {
          addressInput: {
            recipients: [
              {
                address: sendString,
                amount:
                  asset === 'Liquid Bitcoin'
                    ? amountSatsInput
                    : (Number(amountUSDInput) * 100_000_000).toString(),
                asset_id: liquidAssetId,
              },
            ],
          },
          payInput: {
            account_id: liquidAccountId,
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

    const address = result.data?.pay.liquid_address;
    const protectedMnemonic =
      walletData?.wallets.find_one.details.protected_mnemonic;

    if (!address || !protectedMnemonic || !keys) {
      setLoading(false);
      return;
    }

    const message: CryptoWorkerMessage = {
      type: 'signPset',
      payload: {
        wallet_account_id: address.wallet_account.id,
        mnemonic: protectedMnemonic,
        descriptor: address.wallet_account.descriptor,
        pset: address.base_64,
        keys,
      },
    };

    workerRef.current.postMessage(message);
  };

  const payLightningAddress = async () => {
    if (!workerRef.current) {
      return;
    }

    setLoading(true);

    const code =
      sendType === 'lightning-address'
        ? PaymentOptionCode.Lightning
        : asset === 'Liquid Bitcoin'
          ? PaymentOptionCode.Btc
          : PaymentOptionCode.Usdt;

    const network =
      sendType == 'lightning-address'
        ? PaymentOptionNetwork.Bitcoin
        : PaymentOptionNetwork.Liquid;

    const [result, error] = await toWithError(
      client.mutate<
        PayLightningAddressMutation,
        PayLightningAddressMutationVariables
      >({
        mutation: PayLightningAddressDocument,
        variables: {
          payInput: {
            wallet_id: walletData?.wallets.find_one.id,
          },
          addressInput: {
            address: sendString,
            amount:
              asset === 'Liquid Bitcoin'
                ? Number(amountSatsInput)
                : Number(amountUSDInput) * 100_000_000,
            payment_option: {
              code,
              network,
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

    const address = result.data?.pay.money_address;
    const protectedMnemonic =
      walletData?.wallets.find_one.details.protected_mnemonic;

    if (!address || !protectedMnemonic || !keys) {
      setLoading(false);
      return;
    }

    const message: CryptoWorkerMessage = {
      type: 'signPset',
      payload: {
        wallet_account_id: address.wallet_account.id,
        mnemonic: protectedMnemonic,
        descriptor: address.wallet_account.descriptor,
        pset: address.base_64,
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
  }, [client, toast]);

  if (view === 'sent')
    return (
      <div className="mx-auto w-full max-w-lg py-4 lg:py-10">
        <div className="relative mb-14">
          <button
            onClick={() => reset()}
            className="absolute left-0 top-0 transition-opacity hover:opacity-75"
          >
            <ArrowLeft size={24} />
          </button>

          <p className="text-center text-2xl font-semibold">
            {t('App.Wallet.success')}
          </p>
        </div>

        <Image src={success} alt="success" className="mx-auto" />

        <p className="my-6 text-center text-3xl font-medium">
          {t('App.Wallet.started')}
        </p>

        <p className="mb-2 text-center text-4xl font-semibold">
          {formatFiat(Number(amountUSDInput))}
        </p>

        <p className="mb-6 text-center text-sm text-slate-600 dark:text-neutral-400">
          {t('App.Wallet.fee')}: {t('App.Wallet.unknown')}
        </p>

        <Button variant="secondary" className="mx-auto" asChild>
          <Link href={ROUTES.dashboard}>{t('Common.done')}</Link>
        </Button>
      </div>
    );

  if (view === 'confirm')
    return (
      <div className="mx-auto w-full max-w-lg space-y-6 py-4 lg:py-10">
        <div className="relative">
          <button
            onClick={() => reset()}
            disabled={loading}
            className="absolute left-0 top-0 transition-opacity hover:opacity-75"
          >
            <ArrowLeft size={24} />
          </button>

          <p className="text-center text-2xl font-semibold">
            {t('App.Wallet.confirm-pay')}
          </p>
        </div>

        {sendType === 'miban' || sendType === 'liquid' ? (
          <Drawer open={selectAsset} onOpenChange={setSelectAsset}>
            <DrawerTrigger asChild disabled={loading}>
              <button className="mx-auto flex h-10 items-center justify-center space-x-2 rounded-xl border border-slate-200 px-4 font-semibold dark:border-neutral-800">
                <p>{asset}</p> <ChevronsUpDown size={16} />
              </button>
            </DrawerTrigger>

            <DrawerContent>
              <div className="mb-4">
                {assets.map(a => (
                  <DrawerClose key={a} asChild>
                    <button
                      onClick={() => setAsset(a)}
                      className="flex w-full items-center justify-between border-b border-slate-200 py-3 dark:border-neutral-800"
                    >
                      <p>{a}</p>

                      <div
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full border-2',
                          asset === a
                            ? 'border-foreground'
                            : 'border-slate-300 dark:border-neutral-500'
                        )}
                      >
                        <div
                          className={cn(
                            'h-2.5 w-2.5 rounded-full bg-foreground',
                            asset === a ? 'block' : 'hidden'
                          )}
                        />
                      </div>
                    </button>
                  </DrawerClose>
                ))}
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <div className="mx-auto flex h-10 w-fit items-center justify-center space-x-2 rounded-xl border border-slate-200 px-4 font-semibold dark:border-neutral-800">
            <p>Lightning {sendType === 'invoice' ? 'Invoice' : 'Address'}</p>

            <Zap size={16} />
          </div>
        )}

        <p className="text-center font-medium">
          {t('App.Wallet.available')}: {balance}
        </p>

        <div>
          <div className="my-20">
            <div className="relative mb-4 border-b border-primary pb-px">
              <input
                autoFocus={!amountSatsInput}
                id="amount"
                type="number"
                min="0"
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
                    setAmountUSDInput(
                      (latestPricePerSat * numberValue).toFixed(2)
                    );
                  } else {
                    setAmountUSDInput(e.target.value);
                    setAmountSatsInput(
                      (numberValue / latestPricePerSat).toFixed(0)
                    );
                  }
                }}
                disabled={!latestPrice || sendType === 'invoice' || loading}
                readOnly={sendType === 'invoice'}
                className="w-full bg-transparent text-center text-5xl font-medium focus:outline-none"
              />

              <label
                htmlFor="amount"
                className="absolute right-0 top-0 flex h-[62px] items-center justify-center bg-background pl-2 text-sm"
              >
                {satsFirst ? 'SATS' : 'USD'}
              </label>
            </div>

            <div className="flex items-center justify-center space-x-2 text-slate-600 dark:text-neutral-400">
              <p className="overflow-x-auto whitespace-nowrap">
                {satsFirst
                  ? formatFiat(Number(amountUSDInput)) + ' USD'
                  : Number(amountSatsInput).toLocaleString('en-US') + ' sats'}
              </p>

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
            </div>

            <p className="mt-4 text-center font-medium">
              {t('App.Wallet.to')}:{' '}
              {sendType === 'invoice' ? (
                <Link
                  href={ROUTES.external.space + '/node/' + invoiceNode}
                  target="_blank"
                  className="inline-flex items-center text-primary transition-colors hover:text-primary-hover"
                >
                  {recipient}
                  <SquareArrowOutUpRight size={16} className="ml-1" />
                </Link>
              ) : (
                recipient
              )}
            </p>
          </div>

          <p className="mb-3 text-center text-sm text-slate-600 dark:text-neutral-400">
            {t('App.Wallet.fee')}: {t('App.Wallet.unknown')}
          </p>

          <div className="flex justify-center space-x-4">
            <Button
              variant="neutral"
              onClick={() => {
                reset();
              }}
              disabled={loading}
              className="w-full lg:w-36"
            >
              {t('Common.cancel')}
            </Button>

            <Button
              onClick={() => {
                switch (sendType) {
                  case 'invoice':
                    payLightningInvoice();
                    break;

                  case 'liquid':
                    payLiquidAddress();
                    break;

                  case 'lightning-address':
                  case 'miban':
                    payLightningAddress();
                    break;
                }
              }}
              disabled={!keys || !Number(amountSatsInput) || loading}
              className="flex w-full items-center justify-center lg:w-36"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
              ) : null}
              {t('App.Wallet.send')}
            </Button>
          </div>

          {keys ? null : (
            <div className="mt-3 flex items-center justify-center space-x-1 text-sm font-medium text-destructive">
              <Lock size={14} /> <p>{t('App.Wallet.locked')}</p>
            </div>
          )}
        </div>
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 py-4 lg:py-10">
      <div className="relative">
        {sendString ? (
          <button
            onClick={() => setSendString('')}
            className="absolute left-0 top-0 transition-opacity hover:opacity-75"
          >
            <ArrowLeft size={24} />
          </button>
        ) : (
          <Link
            href={ROUTES.dashboard}
            className="absolute left-0 top-0 transition-opacity hover:opacity-75"
          >
            <ArrowLeft size={24} />
          </Link>
        )}

        <p className="text-center text-2xl font-semibold">
          {t('App.Wallet.send')}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="send">{t('App.Wallet.send-options')}</Label>

        <div className="flex items-center space-x-2">
          <Input
            value={sendString}
            onChange={e => setSendString(e.target.value)}
            id="send"
            placeholder={t('App.Wallet.recipient')}
          />

          <Drawer open={showScanner} onOpenChange={setShowScanner}>
            <DrawerTrigger asChild>
              <button className="transition-opacity hover:opacity-75">
                <ScanText size={24} />
              </button>
            </DrawerTrigger>

            <DrawerContent>
              <div className="mx-auto h-64 w-64 sm:h-96 sm:w-96">
                <Scanner
                  onScan={result => {
                    setSendString(result[0].rawValue);
                    setShowScanner(false);
                  }}
                  onError={error => {
                    console.log(error);

                    toast({
                      variant: 'destructive',
                      title: 'Error Scanning QR',
                    });

                    setShowScanner(false);
                  }}
                />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      {!sendString ? (
        <div className="space-y-3">
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {contactsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <div className="h-12 w-12 animate-pulse rounded-full bg-primary" />

                  <div className="space-y-1">
                    <p className="h-6 w-24 animate-pulse rounded-full bg-foreground" />

                    <p className="h-5 w-12 animate-pulse rounded-full bg-slate-600 dark:bg-neutral-400" />
                  </div>
                </div>
              ))
            ) : contacts?.length ? (
              contacts.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSendString(c.money_address)}
                  className="flex w-full items-center space-x-2 rounded-l-full transition-colors hover:bg-foreground/10"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-medium uppercase text-black">
                    {c.money_address.slice(0, 2)}
                  </div>

                  <div className="space-y-1 text-left">
                    <p className="font-medium">
                      {c.money_address.split('@')[0]}
                    </p>

                    <p className="text-sm font-medium text-slate-600 dark:text-neutral-400">
                      {c.money_address.split('@')[1]}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm font-medium text-slate-600 dark:text-neutral-400">
                {t('App.Dashboard.no-contacts')}
              </p>
            )}
          </div>

          <Link
            href={ROUTES.contacts.home}
            className="inline-block font-medium text-primary transition-colors hover:text-primary-hover"
          >
            {t('App.view-all')}
          </Link>

          <Button asChild variant="neutral">
            <Link href={ROUTES.contacts.home + '?add=true'}>
              {t('App.Wallet.add-contact')}
            </Link>
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => {
            if (!latestPrice) {
              toast({
                variant: 'destructive',
                title: 'Waiting for latest asset price.',
              });

              return;
            }

            const latestPricePerSat = latestPrice / 100_000_000;

            const type = checkSendString(sendString);

            if (!type) {
              toast({
                variant: 'destructive',
                title: 'Unrecognized send type.',
                description:
                  'Please reach out to support if you think this is a mistake.',
              });

              return;
            }

            if (type === 'invoice') {
              try {
                const { payeeNodeKey, satoshis } = bolt11.decode(sendString);

                if (payeeNodeKey && satoshis) {
                  setInvoiceNode(payeeNodeKey);
                  setAmountSatsInput(satoshis.toString());
                  setAmountUSDInput((latestPricePerSat * satoshis).toFixed(2));
                } else {
                  toast({
                    variant: 'destructive',
                    title: 'Could not decode invoice.',
                  });

                  return;
                }
              } catch (error) {
                console.log(error);

                toast({
                  variant: 'destructive',
                  title: 'Could not decode invoice.',
                });

                return;
              }
            }

            if (type === 'liquid') {
              const amount = sendString.split('?amount=');

              if (amount.length > 1) {
                const address = amount[0].split('liquid:')[1];

                if (!address) {
                  toast({
                    variant: 'destructive',
                    title: 'Could not decode address.',
                  });

                  return;
                }

                const amountInSats = Number(amount[1]) * 100_000_000;

                setAmountSatsInput(amountInSats.toFixed(0));
                setAmountUSDInput(
                  (latestPricePerSat * amountInSats).toFixed(2)
                );

                setSendString(address);
              }
            }

            setSendType(type);
            setView('confirm');

            if (type === 'liquid' || type === 'miban') {
              setSelectAsset(true);
            }
          }}
          disabled={!liquidAccountId}
          className="w-full"
        >
          {t('Common.continue')}
        </Button>
      )}
    </div>
  );
};
