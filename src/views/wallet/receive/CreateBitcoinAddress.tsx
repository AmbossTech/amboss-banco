import { useTranslations } from 'next-intl';
import { Dispatch, FC, SetStateAction, useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { useToast } from '@/components/ui/use-toast';
import { useCreateOnchainAddressSwapMutation } from '@/graphql/mutations/__generated__/createOnchainAddressSwap.generated';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { SwapCoin, SwapNetwork } from '@/graphql/types';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import { getAddressFromBip21, shorten } from '@/utils/string';

import { CreateView } from './CreateView';
import { ReceiveOptions } from './Receive';

export const CreateBitcoinAddress: FC<{
  receive: ReceiveOptions;
  setReceive: Dispatch<SetStateAction<ReceiveOptions>>;
  receiveString: string;
  setReceiveString: Dispatch<SetStateAction<string>>;
  amountUSDInput: string;
  setAmountUSDInput: Dispatch<SetStateAction<string>>;
  amountSatsInput: string;
  setAmountSatsInput: Dispatch<SetStateAction<string>>;
  amountUSDSaved: string;
  setAmountUSDSaved: Dispatch<SetStateAction<string>>;
  amountSatsSaved: string;
  setAmountSatsSaved: Dispatch<SetStateAction<string>>;
  reset: () => void;
}> = ({
  receive,
  setReceive,
  receiveString,
  setReceiveString,
  amountUSDInput,
  setAmountUSDInput,
  amountSatsInput,
  setAmountSatsInput,
  amountUSDSaved,
  setAmountUSDSaved,
  amountSatsSaved,
  setAmountSatsSaved,
  reset,
}) => {
  const t = useTranslations('App');
  const { toast } = useToast();

  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

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

  const [createOnchainAddress, { loading: onchainLoading }] =
    useCreateOnchainAddressSwapMutation({
      variables: {
        input: {
          amount: Number(amountSatsInput),
          deposit_coin: SwapCoin.Btc,
          deposit_network: SwapNetwork.Bitcoin,
          wallet_account_id: liquidAccountId,
        },
      },
      onCompleted: data =>
        setReceiveString(
          data.wallets.create_onchain_address_swap.bip21 ||
            data.wallets.create_onchain_address_swap.receive_address
        ),
      onError: err => {
        reset();

        const messages = handleApolloError(err);

        toast({
          variant: 'destructive',
          title: 'Error generating Bitcoin address.',
          description: messages.join(', '),
        });
      },
    });

  const onchainAddressFormatted = useMemo(() => {
    if (!receiveString) return t('Wallet.amount');

    const address = getAddressFromBip21(receiveString);

    return shorten(address, 12);
  }, [receiveString, t]);

  const loading = walletLoading || onchainLoading;

  return (
    <CreateView
      receive={receive}
      setReceive={setReceive}
      receiveString={receiveString}
      setReceiveString={setReceiveString}
      amountUSDInput={amountUSDInput}
      setAmountUSDInput={setAmountUSDInput}
      amountSatsInput={amountSatsInput}
      setAmountSatsInput={setAmountSatsInput}
      amountUSDSaved={amountUSDSaved}
      setAmountUSDSaved={setAmountUSDSaved}
      amountSatsSaved={amountSatsSaved}
      setAmountSatsSaved={setAmountSatsSaved}
      receiveText={onchainAddressFormatted}
      dataLoading={loading}
      dataError={Boolean(walletError)}
      createFunction={() => {
        if (amountSatsInput !== amountSatsSaved) {
          createOnchainAddress();
        }
      }}
    />
  );
};
