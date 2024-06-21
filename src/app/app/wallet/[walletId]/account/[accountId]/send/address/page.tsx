import { SendAddressForm } from '@/components/wallet/SendAddressForm';

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
    <div className="mt-4 flex justify-center">
      <SendAddressForm
        walletId={params.walletId}
        accountId={params.accountId}
        assetId={assetId}
      />
    </div>
  );
}
