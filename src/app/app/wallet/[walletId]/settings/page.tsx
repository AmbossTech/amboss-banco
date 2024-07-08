import { useTranslations } from 'next-intl';

import { WalletSettings } from '@/views/wallet/Settings';

export default function Page({ params }: { params: { walletId: string } }) {
  const t = useTranslations('Index');

  return (
    <div>
      <h1 className="my-2 text-xl font-semibold">{t('settings')}</h1>

      <WalletSettings walletId={params.walletId} />
    </div>
  );
}
