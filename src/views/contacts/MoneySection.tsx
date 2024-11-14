'use client';

import { ArrowUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FC, useEffect } from 'react';

import { VaultButton } from '@/components/button/VaultButtonV2';
import { Button } from '@/components/ui/button-v2';
import { Skeleton } from '@/components/ui/skeleton';
import { useContactInfo } from '@/hooks/user';
import { useChat } from '@/stores/contacts';
import { useKeyStore } from '@/stores/keys';

import { PayButton } from './PayButton';

export const MoneySection: FC<{ contactsLoading: boolean }> = ({
  contactsLoading,
}) => {
  const t = useTranslations();

  const keys = useKeyStore(s => s.keys);

  const {
    contact: { payment_options },
    loading,
  } = useContactInfo();

  const currentPaymentOption = useChat(s => s.currentPaymentOption);
  const setCurrentPaymentOption = useChat(s => s.setCurrentPaymentOption);

  useEffect(() => {
    if (loading) return;
    if (!payment_options.length) return;

    const {
      id,
      name,
      code,
      network,
      symbol,
      max_sendable,
      min_sendable,
      decimals,
      fixed_fee,
      variable_fee_percentage,
    } = payment_options[0];

    setCurrentPaymentOption({
      id,
      name,
      code,
      network,
      symbol,
      min_sendable: min_sendable ? Number(min_sendable) : null,
      max_sendable: max_sendable ? Number(max_sendable) : null,
      decimals,
      fixed_fee: Number(fixed_fee),
      variable_fee_percentage: Number(variable_fee_percentage),
    });
  }, [loading, payment_options, setCurrentPaymentOption]);

  if (contactsLoading)
    return (
      <Skeleton className="mt-6 min-h-10 w-full rounded-xl sm:w-[140px] lg:mt-3" />
    );

  if (!keys)
    return <VaultButton className="mt-6 w-full sm:w-[140px] lg:mt-3" />;

  if (loading)
    return (
      <Button
        disabled={true}
        className="mt-6 flex w-full items-center justify-center space-x-2 sm:w-[140px] lg:mt-3"
      >
        <p>{t('App.Contacts.pay')}</p>
        <ArrowUp size={16} />
      </Button>
    );

  if (!payment_options.length || !currentPaymentOption)
    return (
      <Button
        disabled={true}
        className="mt-6 flex w-full items-center justify-center space-x-2 sm:w-fit lg:mt-3"
      >
        <p>{t('App.Contacts.no-pay')}</p>
        <ArrowUp size={16} />
      </Button>
    );

  return <PayButton currentPaymentOption={currentPaymentOption} />;
};
