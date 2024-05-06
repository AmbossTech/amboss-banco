import { InternalHeader } from '@/components/header/InternalHeader';
import { NewWallet } from '@/components/wallet/NewWallet';

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-2 2xl:p-24">
      <InternalHeader />

      <div className="flex w-full items-center justify-center gap-4">
        <NewWallet />
      </div>
    </main>
  );
}
