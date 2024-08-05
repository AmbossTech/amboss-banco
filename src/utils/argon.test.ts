import { generateMasterKeyAndHash } from './argon';

const EMAIL = 'A@test.com';
const PASSWORD = ' with no trim ';

const KEY = '887bd3d06816206e05c7c6153a1de19f309c780144caa47cab733ada26e5b829';
const HASH = '322c1b4cab6c01fa4000fc3a9cea275d95e296f9ac7e441b763a8328ebf97289';

const ALL_CHAR =
  '1234567890-=!@#$%^&*()_+qwertyuiop[]QWERTYUIOP{}|asdfghjkl;ASDFGHJKL:"zxcvbnm,./ZXCVBNM<>?`~ ';

const LONG_CHAR = new Array(10).fill(ALL_CHAR).join('');

describe('generateMasterKeyAndHash', () => {
  test.each([
    [EMAIL, PASSWORD, undefined, undefined],
    [EMAIL.toLowerCase(), PASSWORD, undefined, undefined],
    [EMAIL, PASSWORD.trim(), undefined, undefined],
    [EMAIL.toLowerCase(), PASSWORD.trim(), undefined, undefined],
    [
      ALL_CHAR,
      ALL_CHAR,
      '49960666a8e05e7b6d4e996f6029fdf4bfafd3eac5fbad254c98bbe99c1c83c9',
      '67a6334e08fe81cd4954b1112e89bd276bce223bd25c6d63a023326a6d6219da',
    ],
    [
      LONG_CHAR,
      LONG_CHAR,
      'f8a01ea3b34eed5ca10670c79a00219b9464fb16a1a16c72e749eb6ce0604901',
      '4f05e2cd20f90a840042ca509bdbb27923a026bac560efb7c275023a3e4be919',
    ],
  ] as [string, string, string | undefined, string | undefined][])(
    'correct key and hash',
    async (email, password, key, hash) => {
      const result = await generateMasterKeyAndHash({ email, password });

      expect(result.masterKey).toBe(key || KEY);
      expect(result.masterPasswordHash).toBe(hash || HASH);
    }
  );
});
