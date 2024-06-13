'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';

export default dynamic(
  async function PageComponent() {
    const { Network, Signer, Mnemonic } = await import('lwk_wasm');
    return function PageComponentLoaded() {
      useEffect(() => {
        try {
          const mnemonic = '';

          const network = Network.mainnet();

          const signer = new Signer(new Mnemonic(mnemonic), network);
          const wolletDescriptor = signer.wpkhSlip77Descriptor();

          console.log(wolletDescriptor.toString());
        } catch (error) {
          console.log(error);
        }
      }, []);

      return <p>Hello world</p>;
    };
  },
  {
    ssr: false,
    loading: () => <p>Loading WASM...</p>,
  }
);
