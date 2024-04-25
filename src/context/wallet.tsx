import { useQuery } from '@apollo/client';
import {
  FC,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from 'react';
import { GetWallets } from '../graphql/queries/getWallets';

type State = {
  loading: boolean;
  currentWallet: string;
};

type ProviderProps = { children: ReactNode };
type ActionType = {
  type: 'setWallet';
  id: string;
};

type Dispatch = (action: ActionType) => void;

const StateContext = createContext<State | undefined>(undefined);
const DispatchContext = createContext<Dispatch | undefined>(undefined);

const sessionReducer = (state: State, action: ActionType): State => {
  switch (action.type) {
    case 'setWallet': {
      return { ...state, currentWallet: action.id, loading: false };
    }
    default:
      return state;
  }
};

const WalletProvider: FC<ProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(sessionReducer, {
    currentWallet: '',
    loading: true,
  });

  const { data } = useQuery(GetWallets);

  useEffect(() => {
    if (!data?.wallets?.find_many?.length) return;
    dispatch({ type: 'setWallet', id: data.wallets.find_many[0].id });
  }, [data]);

  console.log(state);

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </DispatchContext.Provider>
  );
};

const useWalletState = () => {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error('useWalletState must be used within a WalletProvider');
  }
  return context;
};

const useWalletDispatch = () => {
  const context = useContext(DispatchContext);
  if (context === undefined) {
    throw new Error('useWalletDispatch must be used within a WalletProvider');
  }
  return context;
};

export { WalletProvider, useWalletState, useWalletDispatch };
