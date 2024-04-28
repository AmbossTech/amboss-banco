import { useState } from 'react';

export const useSeedStorage = () => {
  const [loading, setLoading] = useState(false);

  const getUnusedIndex = async () => {};

  const saveNewWalletSeed = async (mnemonic: string) => {
    setLoading(true);

    const unusedIndex = await getUnusedIndex();

    setLoading(false);
  };

  return { saveNewWalletSeed };
};
