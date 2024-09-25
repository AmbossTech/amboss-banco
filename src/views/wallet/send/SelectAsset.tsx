import { ChevronsUpDown } from 'lucide-react';
import { Dispatch, FC, SetStateAction, useState } from 'react';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { cn } from '@/utils/cn';

import { Assets } from './Send';

const assets: Assets[] = ['Liquid Bitcoin', 'Tether USD'];

export const SelectAsset: FC<{
  loading: boolean;
  asset: Assets;
  setAsset: Dispatch<SetStateAction<Assets>>;
}> = ({ loading, asset, setAsset }) => {
  const [selectAsset, setSelectAsset] = useState(false);

  return (
    <Drawer open={selectAsset} onOpenChange={setSelectAsset}>
      <DrawerTrigger asChild disabled={loading}>
        <button className="mx-auto flex h-10 items-center justify-center space-x-2 rounded-xl border border-slate-200 px-4 font-semibold dark:border-neutral-800">
          <p>{asset}</p> <ChevronsUpDown size={16} />
        </button>
      </DrawerTrigger>

      <DrawerContent>
        <div className="mb-4">
          {assets.map(a => (
            <DrawerClose key={a} asChild>
              <button
                onClick={() => setAsset(a)}
                className="flex w-full items-center justify-between border-b border-slate-200 py-3 dark:border-neutral-800"
              >
                <p>{a}</p>

                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border-2',
                    asset === a
                      ? 'border-foreground'
                      : 'border-slate-300 dark:border-neutral-500'
                  )}
                >
                  <div
                    className={cn(
                      'h-2.5 w-2.5 rounded-full bg-foreground',
                      asset === a ? 'block' : 'hidden'
                    )}
                  />
                </div>
              </button>
            </DrawerClose>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
