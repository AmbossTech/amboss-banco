import { ArrowLeft, ArrowUpDown, ChevronsUpDown } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useQRCode } from 'next-qrcode';
import { useMemo, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Button } from '@/components/ui/button-v2';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useCreateLightningInvoiceMutation } from '@/graphql/mutations/__generated__/createInvoice.generated';
import { useCreateOnchainAddressMutation } from '@/graphql/mutations/__generated__/createOnchainAddress.generated';
import { useGetPriceCurrentQuery } from '@/graphql/queries/__generated__/prices.generated';
import {
  useGetWalletDetailsQuery,
  useGetWalletQuery,
} from '@/graphql/queries/__generated__/wallet.generated';
import { cn } from '@/utils/cn';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import { formatFiat } from '@/utils/fiat';
import { ROUTES } from '@/utils/routes';
import { shorten } from '@/utils/string';

type ReceiveOptions =
  | 'Any Currency'
  | 'Lightning'
  | 'Liquid Bitcoin'
  | 'Tether USD';

const options: ReceiveOptions[] = [
  'Any Currency',
  'Lightning',
  'Liquid Bitcoin',
  'Tether USD',
];

export const Receive = () => {
  const t = useTranslations('App');
  const { toast } = useToast();
  const { Canvas } = useQRCode();

  const [receive, setReceive] = useState<ReceiveOptions>('Any Currency');
  const [receiveString, setReceiveString] = useState('');
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [amountOpen, setAmountOpen] = useState(false);
  const [amountUSDInput, setAmountUSDInput] = useState('');
  const [amountSatsInput, setAmountSatsInput] = useState('');
  const [amountUSDSaved, setAmountUSDSaved] = useState('');
  const [amountSatsSaved, setAmountSatsSaved] = useState('');
  const [satsFirst, setSatsFirst] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [descriptionSaved, setDescriptionSaved] = useState('');

  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const {
    data: detailsData,
    loading: detailsLoading,
    error: detailsError,
  } = useGetWalletDetailsQuery({
    variables: { id: value },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error getting wallet details.',
        description: messages.join(', '),
      });
    },
  });

  const bancoCode = useMemo(() => {
    if (!detailsData?.wallets.find_one.money_address.length) return '';

    const first = detailsData.wallets.find_one.money_address[0];
    const code = first.user + '@' + first.domains[0];

    setReceiveString(code);

    return code;
  }, [detailsData]);

  const {
    data: walletData,
    loading: walletLoading,
    error: walletError,
  } = useGetWalletQuery({
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

  const [
    createLiquidAddress,
    { data: liquidData, loading: liquidLoading, error: liquidError },
  ] = useCreateOnchainAddressMutation({
    variables: { input: { wallet_account_id: liquidAccountId } },
    onCompleted: data =>
      setReceiveString(data.wallets.create_onchain_address.address),
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error generating Liquid address.',
        description: messages.join(', '),
      });
    },
  });

  const liquidAddressFormatted = useMemo(() => {
    if (!liquidData?.wallets.create_onchain_address.address) {
      return '';
    }

    const address = liquidData.wallets.create_onchain_address.address;
    const formatted = (address.match(/.{1,6}/g) || []).join(' - ');

    return formatted;
  }, [liquidData]);

  const [createLightningInvoice, { loading: invoiceLoading }] =
    useCreateLightningInvoiceMutation({
      variables: {
        input: {
          amount: Number(amountSatsInput),
          invoice_description: description,
          wallet_account_id: liquidAccountId,
        },
      },
      onCompleted: data => {
        setReceiveString(data.wallets.create_lightning_invoice.payment_request);
        toast({ title: 'Invoice generated!' });
      },
      onError: err => {
        setReceiveString('');
        setAmountUSDInput('');
        setAmountSatsInput('');
        setAmountUSDSaved('');
        setAmountSatsSaved('');
        setSatsFirst(false);
        setDescription('');
        setDescriptionSaved('');

        const messages = handleApolloError(err);

        toast({
          variant: 'destructive',
          title: 'Error generating Lightning invoice.',
          description: messages.join(', '),
        });
      },
    });

  const receiveText = useMemo(() => {
    switch (receive) {
      case 'Any Currency':
        return bancoCode;
      case 'Lightning':
        return receiveString
          ? shorten(receiveString, 12)
          : t('Wallet.amount-ln');
      case 'Liquid Bitcoin':
      case 'Tether USD':
        return liquidAddressFormatted;
    }
  }, [receive, bancoCode, receiveString, liquidAddressFormatted, t]);

  const {
    data: priceData,
    loading: priceLoading,
    error: priceError,
  } = useGetPriceCurrentQuery({
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

  const loading =
    detailsLoading ||
    walletLoading ||
    liquidLoading ||
    invoiceLoading ||
    priceLoading;

  const error =
    Boolean(detailsError) ||
    Boolean(walletError) ||
    Boolean(liquidError) ||
    Boolean(priceError);

  if (error) return null;

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 py-4 lg:py-10">
      <div className="relative">
        <Link
          href={ROUTES.dashboard}
          className="absolute left-0 top-0 transition-opacity hover:opacity-75"
        >
          <ArrowLeft size={24} />
        </Link>

        <p className="text-center text-2xl font-semibold">
          {t('Wallet.receive')}
        </p>
      </div>

      <Drawer open={optionsOpen} onOpenChange={setOptionsOpen}>
        <DrawerTrigger asChild disabled={loading}>
          <button className="mx-auto flex h-10 items-center justify-center space-x-2 rounded-xl border border-slate-200 px-4 font-semibold dark:border-neutral-800">
            <p>{receive}</p> <ChevronsUpDown size={16} />
          </button>
        </DrawerTrigger>

        <DrawerContent>
          <div className="mb-4">
            {options.map(o => (
              <DrawerClose key={o} asChild>
                <button
                  onClick={() => {
                    setReceive(o);
                    setAmountUSDInput('');
                    setAmountSatsInput('');
                    setAmountUSDSaved('');
                    setAmountSatsSaved('');
                    setSatsFirst(false);
                    setDescription('');
                    setDescriptionSaved('');

                    switch (o) {
                      case 'Any Currency':
                        setReceiveString(bancoCode);
                        break;
                      case 'Lightning':
                        setReceiveString('');
                        setAmountOpen(true);
                        break;
                      case 'Liquid Bitcoin':
                      case 'Tether USD':
                        createLiquidAddress();
                        break;
                    }
                  }}
                  className="flex w-full items-center justify-between border-b border-slate-200 py-3 dark:border-neutral-800"
                >
                  <p>{o}</p>

                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full border-2',
                      receive === o
                        ? 'border-foreground'
                        : 'border-slate-300 dark:border-neutral-500'
                    )}
                  >
                    <div
                      className={cn(
                        'h-2.5 w-2.5 rounded-full bg-foreground',
                        receive === o ? 'block' : 'hidden'
                      )}
                    />
                  </div>
                </button>
              </DrawerClose>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {loading ? (
        <Skeleton className="mx-auto h-[250px] w-[250px] rounded-3xl" />
      ) : (
        <div
          className={cn(
            'round-canvas mx-auto w-fit drop-shadow-2xl dark:drop-shadow-none',
            !receiveString && 'blur'
          )}
        >
          <Canvas
            text={receiveString || 'BancoLibre'}
            options={{
              margin: 3,
              width: 250,
              color: {
                dark: '#000000',
                light: '#FFFFFF',
              },
            }}
          />
        </div>
      )}

      {loading ? (
        <Skeleton className="mx-auto h-6 w-56" />
      ) : (
        <p className="text-center font-semibold text-slate-600 dark:text-neutral-400">
          {receiveText}
        </p>
      )}

      {receive !== 'Any Currency' ? (
        <Drawer
          open={amountOpen}
          onOpenChange={setAmountOpen}
          onClose={() => {
            setTimeout(() => {
              setAmountUSDInput(amountUSDSaved);
              setAmountSatsInput(amountSatsSaved);
            }, 1000);
          }}
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            <DrawerTrigger asChild disabled={loading}>
              {amountUSDSaved ? (
                <button className="text-primary transition-colors hover:text-primary-hover">
                  {formatFiat(Number(amountUSDSaved))} USD
                </button>
              ) : (
                <button className="w-full text-center text-primary transition-colors hover:text-primary-hover">
                  + {t('Wallet.amount-custom')}
                </button>
              )}
            </DrawerTrigger>

            {amountSatsSaved ? (
              <p className="text-slate-600 dark:text-neutral-400">
                {Number(amountSatsSaved).toLocaleString('en-US')} sats
              </p>
            ) : null}
          </div>

          <DrawerContent>
            <div className="relative mb-4 mt-16 border-b border-primary pb-px">
              <input
                autoFocus
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
                className="w-full bg-transparent text-center text-5xl font-medium focus:outline-none"
              />

              <label
                htmlFor="amount"
                className="absolute right-0 top-0 flex h-[62px] items-center justify-center bg-slate-100 pl-2 text-sm dark:bg-neutral-900"
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

            <p className="mb-16 mt-6 text-center text-sm">
              {t('Wallet.amount')}
            </p>

            <Button
              onClick={() => {
                setAmountUSDSaved(Number(amountUSDInput).toFixed(2));
                setAmountSatsSaved(amountSatsInput);

                switch (receive) {
                  case 'Lightning':
                    if (amountSatsInput !== amountSatsSaved) {
                      createLightningInvoice();
                    }
                    break;
                  case 'Liquid Bitcoin':
                  case 'Tether USD':
                    const currentAmount = receiveString.split('amount');
                    const newAmount = Number(amountSatsInput) / 100_000_000;

                    if (currentAmount.length > 1) {
                      setReceiveString(
                        currentAmount[0] + 'amount=' + newAmount
                      );
                    } else {
                      setReceiveString(
                        s => 'liquid:' + s + '?amount=' + newAmount
                      );
                    }
                    break;
                }

                setAmountOpen(false);
              }}
              disabled={!Number(amountSatsInput)}
              className="mb-4 w-full"
            >
              {t('save')}
            </Button>
          </DrawerContent>
        </Drawer>
      ) : null}

      {receive === 'Lightning' ? (
        <Drawer
          open={descriptionOpen}
          onOpenChange={setDescriptionOpen}
          onClose={() => {
            setTimeout(() => {
              setDescription(descriptionSaved);
            }, 1000);
          }}
        >
          <DrawerTrigger asChild disabled={loading}>
            <button className="w-full text-center text-primary transition-colors hover:text-primary-hover">
              {descriptionSaved
                ? '- ' + t('Wallet.edit-desc')
                : '+ ' + t('Wallet.add-desc')}
            </button>
          </DrawerTrigger>

          <DrawerContent>
            <input
              autoFocus
              id="description"
              type="text"
              value={description}
              onChange={e => {
                setDescription(e.target.value);
              }}
              className="mt-16 w-full border-b border-primary bg-transparent pb-px text-center text-5xl font-medium focus:outline-none"
            />

            <label
              htmlFor="description"
              className="mb-16 mt-6 block text-center text-sm"
            >
              {t('Wallet.enter-desc')}
            </label>

            <Button
              onClick={() => {
                setDescriptionSaved(description);

                if (
                  description !== descriptionSaved &&
                  Number(amountSatsInput)
                ) {
                  createLightningInvoice();
                }

                setDescriptionOpen(false);
              }}
              disabled={!description}
              className="mb-4 w-full"
            >
              {t('save')}
            </Button>
          </DrawerContent>
        </Drawer>
      ) : null}

      <Button
        onClick={() => {
          navigator.clipboard.writeText(receiveString);
          toast({ title: 'Copied!' });
        }}
        disabled={loading || !receiveString}
        className="mx-auto w-40"
      >
        {t('copy')}
      </Button>
    </div>
  );
};
