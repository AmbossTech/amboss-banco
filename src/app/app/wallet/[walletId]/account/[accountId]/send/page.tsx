import { SingleWalletBreadcrumb } from '@/components/breadcrumb/wallet';
import { SendForm } from '@/components/wallet/SendForm';

export default function Page({
  params,
  searchParams,
}: {
  params: { walletId: string; accountId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const assetId =
    typeof searchParams?.['assetId'] === 'string'
      ? searchParams?.['assetId']
      : '';

  return (
    <div>
      <SingleWalletBreadcrumb id={params.walletId} currentTitle="Send" />
      <SendForm
        walletId={params.walletId}
        accountId={params.accountId}
        assetId={assetId}
      />
    </div>
  );
}
