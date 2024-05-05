import { SignUpForm } from '@/components/SignUpForm';
import { ThemeToggle } from '@/components/ThemeToggle';

// import Wasm from '@/components/Wasm';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-2 2xl:p-24">
      <div className="mt-1 flex w-full max-w-5xl items-center justify-between text-sm">
        <p className="text-lg font-bold">Banco</p>

        <ThemeToggle />
      </div>
      <div className="flex w-full max-w-5xl items-center justify-center py-10 2xl:py-40">
        <SignUpForm />
      </div>
      {/* <Wasm /> */}
    </main>
  );
}
