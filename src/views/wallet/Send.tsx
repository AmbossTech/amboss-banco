'use client';

import { ChevronRight } from 'lucide-react';
import { FC, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetWalletContactsQuery } from '@/graphql/queries/__generated__/contacts.generated';

export const Send: FC<{ id: string }> = ({ id }) => {
  const [address, setAddress] = useState<string>('');

  const { data } = useGetWalletContactsQuery({
    variables: { id },
  });

  console.log(data);

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-lg font-bold">Send Money</h1>
      <div>
        <Label htmlFor="address">MIBAN Code or Lightning Address</Label>
        <div className="flex gap-1">
          <Input
            value={address}
            onChange={v => setAddress(v.target.value)}
            placeholder="satoshi@mibanco.app"
          />
          <Button size={'icon'}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
