import { InternalHeader } from '@/components/header/InternalHeader';
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
    <main className="flex min-h-screen flex-col items-center justify-start p-2 2xl:p-24">
      <InternalHeader />

      <div className="w-full max-w-5xl">
        <SendForm
          walletId={params.walletId}
          accountId={params.accountId}
          assetId={assetId}
        />
      </div>
    </main>
  );
}
