import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'whitespace-nowrap block w-fit shadow rounded-xl text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'text-black bg-primary-v2 hover:bg-primary-v2-hover',
        secondary: 'text-black dark:bg-white bg-slate-300',
      },
      size: {
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

export { Button, buttonVariants };
