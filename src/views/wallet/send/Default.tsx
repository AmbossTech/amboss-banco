import { Scanner } from '@yudiel/react-qr-scanner';
import bolt11 from 'bolt11';
import { ArrowLeft, Scan } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Dispatch, FC, SetStateAction, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Button } from '@/components/ui/button-v2';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useGetWalletContactsQuery } from '@/graphql/queries/__generated__/contacts.generated';
import { useGetPriceCurrentQuery } from '@/graphql/queries/__generated__/prices.generated';
import { LiquidAssetIDs } from '@/lib/types/assets';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import { ROUTES } from '@/utils/routes';

import { checkSendString } from './checkSendString';
import { Assets, SendType, SendView } from './Send';

export const Default: FC<{
  setAsset: Dispatch<SetStateAction<Assets>>;
  sendString: string;
  setSendString: Dispatch<SetStateAction<string>>;
  setAmountSatsInput: Dispatch<SetStateAction<string>>;
  setAmountUSDInput: Dispatch<SetStateAction<string>>;
  setSendType: Dispatch<SetStateAction<SendType>>;
  setView: Dispatch<SetStateAction<SendView>>;
}> = ({
  setAsset,
  sendString,
  setSendString,
  setAmountSatsInput,
  setAmountUSDInput,
  setSendType,
  setView,
}) => {
  const t = useTranslations();
  const { toast } = useToast();

  const [showScanner, setShowScanner] = useState(false);

  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

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
                <Scan size={24} />
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
                      description: String(error),
                    });

                    setShowScanner(false);
                  }}
                  components={{ audio: false, torch: false }}
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

            if (type === 'dev') {
              setSendType('miban');
              setView('confirm');
              return;
            }

            const prefix = sendString.split(':');
            const sendStringFormatted =
              prefix.length > 1 ? prefix[1] : prefix[0];

            if (type === 'invoice') {
              try {
                const { satoshis } = bolt11.decode(sendStringFormatted);

                if (satoshis) {
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
              const params = sendStringFormatted.split('?');

              if (params.length > 1) {
                const paramsDecoded = new URLSearchParams(params[1]);
                const assetID = paramsDecoded.get('assetid');
                const amount = Number(paramsDecoded.get('amount'));
                let type: LiquidAssetIDs | undefined;

                if (assetID) {
                  switch (assetID) {
                    case LiquidAssetIDs.BTC:
                      setAsset('Liquid Bitcoin');
                      type = LiquidAssetIDs.BTC;
                      break;
                    case LiquidAssetIDs.USDT:
                      setAsset('Tether USD');
                      type = LiquidAssetIDs.USDT;
                      break;
                    default:
                      toast({
                        variant: 'destructive',
                        title: 'Unknown asset ID.',
                      });
                      return;
                  }
                }

                if (amount > 0) {
                  switch (type) {
                    case LiquidAssetIDs.USDT: {
                      const amountInSats = amount / latestPricePerSat;
                      setAmountSatsInput(amountInSats.toFixed(0));
                      setAmountUSDInput(amount.toFixed(2));
                      break;
                    }
                    case LiquidAssetIDs.BTC:
                    default: {
                      const amountInSats = amount * 100_000_000;
                      setAmountSatsInput(amountInSats.toFixed(0));
                      setAmountUSDInput(
                        (latestPricePerSat * amountInSats).toFixed(2)
                      );
                      break;
                    }
                  }
                }

                setSendString(params[0]);
              } else {
                setSendString(sendStringFormatted);
              }
            } else {
              setSendString(sendStringFormatted);
            }

            if (type === 'bitcoin') {
              const params = sendStringFormatted.split('?');

              if (params.length > 1) {
                const paramsDecoded = new URLSearchParams(params[1]);
                const amount = Number(paramsDecoded.get('amount'));

                if (amount > 0) {
                  const amountInSats = amount * 100_000_000;
                  setAmountSatsInput(amountInSats.toFixed(0));
                  setAmountUSDInput(
                    (latestPricePerSat * amountInSats).toFixed(2)
                  );
                }

                setSendString(params[0]);
              } else {
                setSendString(sendStringFormatted);
              }
            } else {
              setSendString(sendStringFormatted);
            }

            setSendType(type);
            setView('confirm');
          }}
          className="w-full"
        >
          {t('Common.continue')}
        </Button>
      )}
    </div>
  );
};
