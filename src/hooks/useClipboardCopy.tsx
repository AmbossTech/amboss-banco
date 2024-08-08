import { useEffect, useState } from 'react';

type CopyParams = {
  successDuration?: number;
};

export default function useCopyClipboard(
  options: CopyParams = { successDuration: 2000 }
): [string | undefined, (text: string) => void] {
  const [copiedText, setCopiedText] = useState<string | undefined>();
  const successDuration = options.successDuration;

  useEffect(() => {
    if (!copiedText || !successDuration) return;

    const id = setTimeout(() => {
      setCopiedText(undefined);
    }, successDuration);

    return () => {
      clearTimeout(id);
    };
  }, [copiedText, successDuration]);

  return [
    copiedText,
    (text: string) => {
      navigator.clipboard.writeText(text);
      setCopiedText(text);
    },
  ];
}
