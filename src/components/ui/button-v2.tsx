import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { FC, ReactNode } from 'react';

import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'whitespace-nowrap block w-fit shadow rounded-xl text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'text-black bg-primary hover:bg-primary-hover',
        secondary: 'text-black dark:bg-white bg-slate-300',
        neutral: 'bg-neutral-800 text-white',
      },
      size: {
        sm: 'p-2',
        md: 'px-4 py-2',
        lg: 'px-6 py-3',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

const IconButton: FC<{
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}> = ({ icon, onClick, disabled, className }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-300 text-black dark:bg-neutral-800 dark:text-white',
        className
      )}
    >
      {icon}
    </button>
  );
};

export { Button, buttonVariants, IconButton };
