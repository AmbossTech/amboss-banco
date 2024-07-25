'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Send } from '@/views/wallet/Send';

export default function Page({ params }: { params: { walletId: string } }) {
  const router = useRouter();

  return (
    <div className="mt-4 flex flex-col justify-start">
      <button
        className="mb-4 flex items-center gap-1"
        onClick={() => router.back()}
      >
        <ChevronLeft className="size-4" />
        <p className="text-sm">Back</p>
      </button>
      <Send id={params.walletId} />
    </div>
  );
}
