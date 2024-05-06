'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

export function NewWallet() {
  const workerRef = useRef<Worker>();

  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (loading) return;

    setLoading(true);

    if (workerRef.current) {
      const message = {
        type: 'new',
      };

      workerRef.current.postMessage(message);
    }
  };

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../../workers/crypto/crypto.ts', import.meta.url)
    );

    workerRef.current.onmessage = event => {
      const message = event.data;

      switch (message.type) {
        case 'new':
          console.log(message);
          break;

        default:
          console.error('Unhandled message type:', event.data.type);
          break;
      }

      setLoading(false);
    };

    workerRef.current.onerror = error => {
      console.error('Worker error:', error);
      setLoading(false);
    };

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  return (
    <div>
      <Button disabled={loading} onClick={handleCreate}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        New Wallet
      </Button>
    </div>
  );
}
