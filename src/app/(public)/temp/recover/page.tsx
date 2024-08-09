'use client';

import { hexToBytes } from '@noble/hashes/utils';
import { nip44 } from 'nostr-tools';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { generateMasterKeyAndHash } from '@/utils/argon';

export default function Page() {
  const { toast } = useToast();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [protectedMnemonic, setProtectedMnemonic] = useState<string>('');
  const [mnemonic, setMnemonic] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const decrypt = useCallback(async () => {
    if (loading) return;

    setLoading(true);

    try {
      const { masterKey } = await generateMasterKeyAndHash({ email, password });

      const decrypted = nip44.v2.decrypt(
        protectedMnemonic,
        hexToBytes(masterKey)
      );

      setMnemonic(decrypted);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error decrypting.',
        description:
          'Check your password and email and make sure you are copying the complete encrypted mnemonic.',
      });
      setMnemonic('');
    }

    setLoading(false);
  }, [email, loading, password, protectedMnemonic, toast]);

  return (
    <div className="my-4 flex w-full flex-col gap-4">
      <h1 className="font-semibold">Recover your Mnemonic</h1>
      <div>
        <Label>Email</Label>
        <Input
          value={email}
          onChange={value => setEmail(value.target.value)}
          placeholder="Type your email"
        />
      </div>
      <div>
        <Label>Password</Label>
        <Input
          type="password"
          autoComplete="off"
          value={password}
          onChange={value => setPassword(value.target.value)}
          placeholder="Type your password"
        />
      </div>
      <div>
        <Label>Encrypted Mnemonic</Label>
        <Input
          value={protectedMnemonic}
          onChange={value => setProtectedMnemonic(value.target.value)}
          placeholder="Type your encrypted mnemonic"
        />
      </div>
      <Button
        disabled={!email || !password || !protectedMnemonic || loading}
        onClick={() => decrypt()}
      >
        {!loading ? 'Decrypt' : 'Decrypting...'}
      </Button>
      {!!mnemonic ? (
        <div>
          <Label>Mnemonic</Label>
          <Input readOnly contentEditable={'false'} value={mnemonic} />
        </div>
      ) : null}
    </div>
  );
}
