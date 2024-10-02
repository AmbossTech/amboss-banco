import { useTranslations } from 'next-intl';
import { Dispatch, FC, useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { useToast } from '@/components/ui/use-toast';
import { useCreateOnchainAddressSwapMutation } from '@/graphql/mutations/__generated__/createOnchainAddressSwap.generated';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { SwapCoin, SwapNetwork } from '@/graphql/types';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import { getAddressFromBip21, shorten } from '@/utils/string';

import { CreateView } from './CreateView';
import { ReceiveAction, ReceiveState } from './Receive';

export const CreateBitcoinAddress: FC<{
  state: ReceiveState;
  dispatch: Dispatch<ReceiveAction>;
}> = ({ state, dispatch }) => {
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
          amount: Number(state.amountSatsInput),
          deposit_coin: SwapCoin.Btc,
          deposit_network: SwapNetwork.Bitcoin,
          wallet_account_id: liquidAccountId,
        },
      },
      onCompleted: data =>
        dispatch({
          type: 'receiveString',
          nextString:
            data.wallets.create_onchain_address_swap.bip21 ||
            data.wallets.create_onchain_address_swap.receive_address,
        }),
      onError: err => {
        dispatch({ type: 'reset' });

        const messages = handleApolloError(err);

        toast({
          variant: 'destructive',
          title: 'Error generating Bitcoin address.',
          description: messages.join(', '),
        });
      },
    });

  const onchainAddressFormatted = useMemo(() => {
    if (!state.receiveString) return t('Wallet.amount');

    const address = getAddressFromBip21(state.receiveString);

    return shorten(address, 12);
  }, [state.receiveString, t]);

  const loading = walletLoading || onchainLoading;

  return (
    <CreateView
      state={state}
      dispatch={dispatch}
      receiveText={onchainAddressFormatted}
      dataLoading={loading}
      dataError={Boolean(walletError)}
      createFunction={() => {
        if (state.amountSatsInput !== state.amountSatsSaved) {
          createOnchainAddress();
        }
      }}
    />
  );
};
