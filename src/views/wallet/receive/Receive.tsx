import { useReducer } from 'react';

import { CreateBitcoinAddress } from './CreateBitcoinAddress';
import { CreateLightningAddress } from './CreateLightningAddress';
import { CreateLightningInvoice } from './CreateLightningInvoice';
import { CreateLiquidAddress } from './CreateLiquidAddress';

export type ReceiveState = {
  receive: ReceiveOptions;
  receiveString: string;
  amountUSDInput: string;
  amountSatsInput: string;
  amountUSDSaved: string;
  amountSatsSaved: string;
};

export type ReceiveAction = {
  type:
    | 'receive'
    | 'receiveString'
    | 'amountUSDInput'
    | 'amountSatsInput'
    | 'amountUSDSaved'
    | 'amountSatsSaved'
    | 'reset';
  nextReceive?: ReceiveOptions;
  nextString?: string;
};

function reducer(state: ReceiveState, action: ReceiveAction) {
  switch (action.type) {
    case 'receive': {
      return {
        ...state,
        receive: action.nextReceive ?? state.receive,
      };
    }
    case 'receiveString': {
      return {
        ...state,
        receiveString: action.nextString ?? state.receiveString,
      };
    }
    case 'amountUSDInput':
      return {
        ...state,
        amountUSDInput: action.nextString ?? state.amountUSDInput,
      };
    case 'amountSatsInput':
      return {
        ...state,
        amountSatsInput: action.nextString ?? state.amountSatsInput,
      };
    case 'amountUSDSaved':
      return {
        ...state,
        amountUSDSaved: action.nextString ?? state.amountUSDSaved,
      };
    case 'amountSatsSaved':
      return {
        ...state,
        amountSatsSaved: action.nextString ?? state.amountSatsSaved,
      };
    case 'reset':
      return {
        receive: state.receive,
        receiveString: '',
        amountUSDInput: '',
        amountSatsInput: '',
        amountUSDSaved: '',
        amountSatsSaved: '',
      };
  }
}

const initialState: ReceiveState = {
  receive: 'Any Currency',
  receiveString: '',
  amountUSDInput: '',
  amountSatsInput: '',
  amountUSDSaved: '',
  amountSatsSaved: '',
};

export type ReceiveOptions =
  | 'Any Currency'
  | 'Lightning'
  | 'Liquid Bitcoin'
  | 'Tether USD'
  | 'Bitcoin';

export const Receive = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  switch (state.receive) {
    case 'Any Currency':
      return <CreateLightningAddress state={state} dispatch={dispatch} />;
    case 'Lightning':
      return <CreateLightningInvoice state={state} dispatch={dispatch} />;
    case 'Liquid Bitcoin':
    case 'Tether USD':
      return <CreateLiquidAddress state={state} dispatch={dispatch} />;
    case 'Bitcoin':
      return <CreateBitcoinAddress state={state} dispatch={dispatch} />;
  }
};
