import Image from 'next/image';
import { useQRCode } from 'next-qrcode';
import { FC } from 'react';

import logo from '/public/icons/qr-logo.svg';
import { cn } from '@/utils/cn';

export const QrCode: FC<{
  text: string;
  width?: number;
  className?: string;
}> = ({ text, width = 250, className }) => {
  const { Canvas } = useQRCode();

  return (
    <div className={cn('round-canvas relative', className)}>
      <Image
        src={logo}
        alt="logo"
        className="absolute left-1/2 top-1/2 w-14 -translate-x-1/2 -translate-y-1/2"
      />

      <Canvas
        text={text}
        options={{
          margin: 3,
          width,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        }}
      />
    </div>
  );
};
