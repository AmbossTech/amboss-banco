import { FC, ReactNode } from 'react';

export const Section: FC<{
  title: string | ReactNode;
  description: string | ReactNode;
  children: ReactNode;
}> = ({ title, description, children }) => {
  return (
    <div className="flex flex-col gap-0 md:grid md:grid-cols-[40%_60%]">
      <div className="mb-4 md:mb-0 md:mr-4">
        <h3 className="font-semibold leading-none tracking-tight">{title}</h3>
        <p className="mt-2 max-w-80 text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
};
