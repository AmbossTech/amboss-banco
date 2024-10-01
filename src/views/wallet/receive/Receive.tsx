import { useState } from 'react';

import { CreateBitcoinAddress } from './CreateBitcoinAddress';
import { CreateLightningAddress } from './CreateLightningAddress';
import { CreateLightningInvoice } from './CreateLightningInvoice';
import { CreateLiquidAddress } from './CreateLiquidAddress';

export type ReceiveOptions =
  | 'Any Currency'
  | 'Lightning'
  | 'Liquid Bitcoin'
  | 'Tether USD'
  | 'Bitcoin';

export const Receive = () => {
  const [receive, setReceive] = useState<ReceiveOptions>('Any Currency');
  const [receiveString, setReceiveString] = useState('');
  const [amountUSDInput, setAmountUSDInput] = useState('');
  const [amountSatsInput, setAmountSatsInput] = useState('');
  const [amountUSDSaved, setAmountUSDSaved] = useState('');
  const [amountSatsSaved, setAmountSatsSaved] = useState('');

  const reset = () => {
    setReceiveString('');
    setAmountUSDInput('');
    setAmountSatsInput('');
    setAmountUSDSaved('');
    setAmountSatsSaved('');
  };

  switch (receive) {
    case 'Any Currency':
      return (
        <CreateLightningAddress
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
        />
      );
    case 'Lightning':
      return (
        <CreateLightningInvoice
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
          reset={reset}
        />
      );
    case 'Liquid Bitcoin':
    case 'Tether USD':
      return (
        <CreateLiquidAddress
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
        />
      );
    case 'Bitcoin':
      return (
        <CreateBitcoinAddress
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
          reset={reset}
        />
      );
  }
};
