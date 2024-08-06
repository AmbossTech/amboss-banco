import { useEffect, useState } from 'react';

type CopyParams = {
  successDuration?: number;
};

export default function useCopyClipboard(
  options: CopyParams = { successDuration: 2000 }
): [boolean, (text: string) => void] {
  const [isCopied, setIsCopied] = useState(false);
  const successDuration = options.successDuration;

  useEffect(() => {
    if (!isCopied || !successDuration) return;

    const id = setTimeout(() => {
      setIsCopied(false);
    }, successDuration);

    return () => {
      clearTimeout(id);
    };
  }, [isCopied, successDuration]);

  return [
    isCopied,
    (text: string) => {
      navigator.clipboard.writeText(text);
      setIsCopied(true);
    },
  ];
}
