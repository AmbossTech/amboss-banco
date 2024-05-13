import { useQRCode } from 'next-qrcode';
import { FC } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateOnchainAddressMutation } from '@/graphql/mutations/__generated__/createOnchainAddress.generated';

export const ReceiveAddress: FC<{ accountId: string }> = ({ accountId }) => {
  const { Canvas } = useQRCode();

  const [create, { data, loading, error }] = useCreateOnchainAddressMutation({
    variables: { input: { wallet_account_id: accountId } },
  });

  console.log({ data, loading, error });

  return (
    <div>
      <Button onClick={() => create()}>Create</Button>
      {data?.wallets.create_onchain_address.address ? (
        <>
          <Canvas
            text={data.wallets.create_onchain_address.address}
            options={{
              errorCorrectionLevel: 'M',
              margin: 3,
              scale: 4,
              width: 200,
              color: {
                dark: '#010599FF',
                light: '#FFBF60FF',
              },
            }}
          />
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type="email"
              readOnly
              defaultValue={data.wallets.create_onchain_address.address}
            />
            <Button
              onClick={() =>
                navigator.clipboard.writeText(
                  data.wallets.create_onchain_address.address
                )
              }
            >
              Copy
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
};
