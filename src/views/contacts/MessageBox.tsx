'use client';

import { DollarSign, Loader2, Mail } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useContactInfo } from '@/hooks/user';
import { useChat } from '@/stores/contacts';

import { SendMessageBox } from './boxes/MessageBox';
import { PayMessageBox } from './boxes/PayBox';

export const ContactMessageBox = () => {
  const {
    contact: { payment_options, encryption_pubkey },
    loading,
  } = useContactInfo();

  const currentChatBox = useChat(s => s.currentChatBox);
  const setCurrentChatBox = useChat(s => s.setCurrentChatBox);

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
  }, [payment_options, loading, setCurrentPaymentOption]);

  if (loading) {
    return (
      <div className="flex w-full justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!payment_options.length && !encryption_pubkey) {
    return (
      <div className="flex w-full justify-center">
        <p className="text-sm text-muted-foreground">
          No action available for this contact.
        </p>
      </div>
    );
  }

  if (!payment_options.length || !currentPaymentOption) {
    return <SendMessageBox />;
  }

  if (!encryption_pubkey) {
    return <PayMessageBox currentPaymentOption={currentPaymentOption} />;
  }

  switch (currentChatBox) {
    case 'pay':
      return (
        <PayMessageBox
          currentPaymentOption={currentPaymentOption}
          iconOptions={
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => setCurrentChatBox('message')}
                >
                  <Mail className="size-4" />
                  <span className="sr-only">Send Message</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Send Message</TooltipContent>
            </Tooltip>
          }
        />
      );

    default:
      return (
        <SendMessageBox
          iconOptions={
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => setCurrentChatBox('pay')}
                >
                  <DollarSign className="size-4" />
                  <span className="sr-only">Send Money</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Send Money</TooltipContent>
            </Tooltip>
          }
        />
      );
  }
};
