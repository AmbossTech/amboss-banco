import { deleteItemAsync, setItemAsync } from 'expo-secure-store';
import React, {
  createContext,
  FC,
  ReactNode,
  useContext,
  useReducer,
} from 'react';

type State = {
  accountCreated: boolean;
  pin: number | null;
  mnemonic: string | null;
};

type ProviderProps = { accountCreated: boolean; children: ReactNode };

type ActionType = {
  type: 'setMnemonic';
  mnemonic: string | null;
  pin: number[];
};

type Dispatch = {
  setMnemonic: (mnemonic: string, pin: number[]) => Promise<void>;
};

const StateContext = createContext<State | undefined>(undefined);
const DispatchContext = createContext<Dispatch | undefined>(undefined);

async function setSecureStorageItemAsync(key: string, value: string | null) {
  if (value == null) {
    await deleteItemAsync(key);
  } else {
    await setItemAsync(key, value);
  }
}

const sessionReducer = (state: State, action: ActionType): State => {
  switch (action.type) {
    case 'setMnemonic': {
      return { ...state, mnemonic: action.mnemonic };
    }
    default:
      return state;
  }
};

const SessionProvider: FC<ProviderProps> = ({ accountCreated, children }) => {
  const [state, dispatch] = useReducer(sessionReducer, {
    accountCreated,
    pin: null,
    mnemonic: null,
  });

  const actions = {
    setMnemonic: async (mnemonic: string, pin: number[]) => {
      console.log(mnemonic);
      console.log(pin);

      await setSecureStorageItemAsync('mnemonic', mnemonic);
      await setSecureStorageItemAsync('pin', pin.join(' '));
      dispatch({ type: 'setMnemonic', mnemonic, pin });
    },
  };

  return (
    <DispatchContext.Provider value={actions}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </DispatchContext.Provider>
  );
};

const useSessionState = () => {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error('useSessionState must be used within a SessionProvider');
  }
  return context;
};

const useSessionDispatch = () => {
  const context = useContext(DispatchContext);
  if (context === undefined) {
    throw new Error('useSessionDispatch must be used within a SessionProvider');
  }
  return context;
};

export { SessionProvider, useSessionState, useSessionDispatch };
