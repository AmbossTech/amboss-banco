import { Header } from '@/components/Header';

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-2 2xl:p-24">
      <Header />

      <div className="flex w-full items-center justify-center gap-4">
        NEW WALLET
      </div>
    </main>
  );
}
