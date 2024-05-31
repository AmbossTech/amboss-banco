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
    <div className="mt-2">
      <SendForm
        walletId={params.walletId}
        accountId={params.accountId}
        assetId={assetId}
      />
    </div>
  );
}
