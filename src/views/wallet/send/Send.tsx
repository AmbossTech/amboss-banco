import { useState } from 'react';

import { Default } from './Default';
import { PayLightningAddress } from './PayLightningAddress';
import { PayLightningInvoice } from './PayLightningInvoice';
import { PayLiquidAddress } from './PayLiquidAddress';
import { Success } from './Success';

export type SendView = 'default' | 'confirm' | 'sent';
export type SendType =
  | 'miban'
  | 'lightning-address'
  | 'invoice'
  | 'liquid'
  | undefined;
export type Assets = 'Liquid Bitcoin' | 'Tether USD';

export const Send = () => {
  const [view, setView] = useState<SendView>('default');
  const [sendString, setSendString] = useState('');
  const [sendType, setSendType] = useState<SendType>();
  const [asset, setAsset] = useState<Assets>('Liquid Bitcoin');
  const [amountUSDInput, setAmountUSDInput] = useState('');
  const [amountSatsInput, setAmountSatsInput] = useState('');

  const reset = () => {
    setView('default');
    setSendString('');
    setSendType(undefined);
    setAsset('Liquid Bitcoin');
    setAmountUSDInput('');
    setAmountSatsInput('');
  };

  if (view === 'sent')
    return <Success reset={reset} amountUSDInput={amountUSDInput} />;

  if (view === 'confirm') {
    switch (sendType) {
      case 'miban':
      case 'lightning-address':
        return (
          <PayLightningAddress
            sendType={sendType}
            asset={asset}
            setAsset={setAsset}
            sendString={sendString}
            setView={setView}
            reset={reset}
            amountSatsInput={amountSatsInput}
            amountUSDInput={amountUSDInput}
            setAmountSatsInput={setAmountSatsInput}
            setAmountUSDInput={setAmountUSDInput}
          />
        );
      case 'invoice':
        return (
          <PayLightningInvoice
            sendString={sendString}
            setView={setView}
            reset={reset}
            amountSatsInput={amountSatsInput}
            amountUSDInput={amountUSDInput}
            setAmountSatsInput={setAmountSatsInput}
            setAmountUSDInput={setAmountUSDInput}
          />
        );
      case 'liquid':
        return (
          <PayLiquidAddress
            asset={asset}
            setAsset={setAsset}
            sendString={sendString}
            setView={setView}
            reset={reset}
            amountSatsInput={amountSatsInput}
            amountUSDInput={amountUSDInput}
            setAmountSatsInput={setAmountSatsInput}
            setAmountUSDInput={setAmountUSDInput}
          />
        );
    }
  }

  return (
    <Default
      setAsset={setAsset}
      sendString={sendString}
      setSendString={setSendString}
      setAmountSatsInput={setAmountSatsInput}
      setAmountUSDInput={setAmountUSDInput}
      setSendType={setSendType}
      setView={setView}
    />
  );
};
