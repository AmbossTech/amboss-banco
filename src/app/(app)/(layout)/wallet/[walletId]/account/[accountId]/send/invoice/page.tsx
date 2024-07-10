import { SendInvoiceForm } from '@/components/wallet/SendInvoiceForm';

export default function Page({
  params,
}: {
  params: { walletId: string; accountId: string };
}) {
  return (
    <div className="mt-4 flex justify-center">
      <SendInvoiceForm
        walletId={params.walletId}
        accountId={params.accountId}
      />
    </div>
  );
}
