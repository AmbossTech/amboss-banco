import Link from 'next/link';

import { ROUTES } from '@/utils/routes';

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
    <div className="mt-4 flex w-full flex-col items-center justify-center">
      <h1 className="text-lg font-bold">Payment Options</h1>
      <div className="mt-4 flex justify-center gap-4">
        <Link
          href={ROUTES.app.wallet.send.invoice(
            params.walletId,
            params.accountId,
            assetId
          )}
        >
          <button className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card p-6 text-card-foreground hover:border-purple-700">
            <h3 className="font-semibold leading-none tracking-tight">
              Lightning Invoice
            </h3>
            <p className="max-w-40 text-sm text-muted-foreground">
              Pay a Lightning Invoice from this wallet.
            </p>
          </button>
        </Link>

        <Link
          href={ROUTES.app.wallet.send.address(
            params.walletId,
            params.accountId,
            assetId
          )}
        >
          <button className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card p-6 text-card-foreground hover:border-purple-700">
            <h3 className="font-semibold leading-none tracking-tight">
              Onchain Address
            </h3>
            <p className="max-w-40 text-sm text-muted-foreground">
              Pay an onchain address from this wallet.
            </p>
          </button>
        </Link>
      </div>
    </div>
  );
}
