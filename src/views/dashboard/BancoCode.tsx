import { Copy, CopyCheck, QrCode } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQRCode } from 'next-qrcode';
import { FC, useMemo, useState } from 'react';

import { IconButton } from '@/components/ui/button-v2';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useGetWalletDetailsQuery } from '@/graphql/queries/__generated__/wallet.generated';
import useCopyClipboard from '@/hooks/useClipboardCopy';
import { handleApolloError } from '@/utils/error';

export const BancoCode: FC<{ id: string }> = ({ id }) => {
  const t = useTranslations('App');
  const { Canvas } = useQRCode();
  const { toast } = useToast();

  const { data, loading } = useGetWalletDetailsQuery({
    variables: { id },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error getting wallet details.',
        description: messages.join(', '),
      });
    },
  });

  const address = useMemo(() => {
    if (!data?.wallets.find_one.money_address.length) return '';

    const first = data.wallets.find_one.money_address[0];

    return first.user + '@' + first.domains[0];
  }, [data]);

  const [copiedText, copy] = useCopyClipboard();
  const [showQR, setShowQR] = useState(false);

  if (loading)
    return (
      <div className="h-28 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-neutral-900" />
    );

  if (!address) return null;

  return (
    <Card className="space-y-3">
      <div className="flex w-full justify-between space-x-2">
        <p className="font-semibold text-slate-600 dark:text-neutral-400">
          {t('miban')}
        </p>

        <div className="flex space-x-2">
          <IconButton
            icon={
              copiedText === address ? (
                <CopyCheck size={20} />
              ) : (
                <Copy size={20} />
              )
            }
            onClick={() => copy(address)}
          />

          <Dialog open={showQR} onOpenChange={setShowQR}>
            <DialogTrigger asChild>
              <IconButton icon={<QrCode size={20} />} />
            </DialogTrigger>

            <DialogContent className="w-fit">
              <DialogHeader>
                <DialogTitle>{t('miban')}</DialogTitle>
                <DialogDescription>{address}</DialogDescription>
              </DialogHeader>

              <Canvas
                text={'lightning:' + address}
                options={{
                  margin: 3,
                  width: 250,
                  color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                  },
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <p className="break-all font-semibold lg:text-xl">{address}</p>
    </Card>
  );
};
