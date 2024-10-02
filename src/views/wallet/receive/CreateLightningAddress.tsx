import { Dispatch, FC } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { useToast } from '@/components/ui/use-toast';
import { useGetWalletDetailsQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';

import { CreateView } from './CreateView';
import { ReceiveAction, ReceiveState } from './Receive';

export const CreateLightningAddress: FC<{
  state: ReceiveState;
  dispatch: Dispatch<ReceiveAction>;
}> = ({ state, dispatch }) => {
  const { toast } = useToast();

  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const { loading: detailsLoading, error: detailsError } =
    useGetWalletDetailsQuery({
      variables: { id: value },
      onCompleted: data => {
        const first = data.wallets.find_one.money_address[0];
        const code = first.user + '@' + first.domains[0];

        dispatch({ type: 'receiveString', nextString: code });
      },
      onError: err => {
        const messages = handleApolloError(err);

        toast({
          variant: 'destructive',
          title: 'Error getting wallet details.',
          description: messages.join(', '),
        });
      },
    });

  return (
    <CreateView
      state={state}
      dispatch={dispatch}
      receiveText={state.receiveString}
      dataLoading={detailsLoading}
      dataError={Boolean(detailsError)}
    />
  );
};
