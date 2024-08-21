import { FC, ReactNode } from 'react';

import { cn } from '@/utils/cn';

export const CardSection: FC<{
  bg: string;
  accent: string;
  icon: string | ReactNode;
  title: string;
  subtitle: string;
  image: ReactNode;
  reverse?: boolean;
  className?: string;
}> = ({ bg, accent, icon, title, subtitle, image, reverse, className }) => {
  return (
    <div
      className={cn(
        'relative grid w-full items-center gap-6 rounded-3xl p-4 lg:grid-cols-2 lg:px-14 lg:py-10',
        bg,
        className
      )}
    >
      <div
        className={cn(
          'flex-col justify-between lg:flex lg:h-full',
          reverse ? 'lg:order-last' : 'order-first'
        )}
      >
        <div
          className={cn(
            'mb-4 flex h-14 w-14 items-center justify-center rounded-full text-[22px] font-semibold text-black lg:h-16 lg:w-16 lg:text-3xl',
            accent
          )}
        >
          {icon}
        </div>

        <div>
          <h3
            className={cn(
              'mb-2 text-[28px] font-semibold lg:text-[32px]',
              bg === 'bg-accent-black' ? 'text-white' : 'text-black'
            )}
          >
            {title}
          </h3>

          <p
            className={cn(
              'text-lg font-semibold text-black',
              bg === 'bg-accent-black' ? 'text-white' : 'text-black'
            )}
          >
            {subtitle}
          </p>
        </div>
      </div>

      {image}
    </div>
  );
};
