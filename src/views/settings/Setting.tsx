import { FC, ReactNode } from 'react';

import { cn } from '@/utils/cn';

export const Setting: FC<{
  title: string;
  description: string;
  icon: ReactNode;
  alert?: boolean;
  className?: string;
  children?: ReactNode;
}> = ({ title, description, icon, alert, className, children }) => {
  return (
    <div className="flex w-full items-center space-x-4">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 dark:bg-neutral-800">
        {icon}

        {alert ? (
          <div className="absolute right-0 top-0">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            </span>
          </div>
        ) : null}
      </div>

      <div className="space-y-0.5">
        <p className="font-semibold">{title}</p>

        <p
          className={cn(
            'min-h-5 text-sm font-medium text-slate-600 dark:text-neutral-400',
            className
          )}
        >
          {description}
        </p>

        {children}
      </div>
    </div>
  );
};
