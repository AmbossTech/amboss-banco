import type { Event, EventTemplate, UnsignedEvent } from 'nostr-tools';
import {
  finalizeEvent,
  generateSecretKey,
  getEventHash,
  getPublicKey,
  nip44,
} from 'nostr-tools';

type Rumor = UnsignedEvent & { id: string };

const TWO_DAYS = 2 * 24 * 60 * 60;

const now = () => Math.round(Date.now() / 1000);
const randomNow = () => Math.round(now() - Math.random() * TWO_DAYS);

const nip44ConversationKey = (privateKey: Uint8Array, publicKey: string) =>
  nip44.v2.utils.getConversationKey(privateKey, publicKey);

const nip44Encrypt = (
  data: EventTemplate,
  privateKey: Uint8Array,
  publicKey: string
) =>
  nip44.v2.encrypt(
    JSON.stringify(data),
    nip44ConversationKey(privateKey, publicKey)
  );

const nip44Decrypt = (data: Event, privateKey: Uint8Array): Event =>
  JSON.parse(
    nip44.v2.decrypt(
      data.content,
      nip44ConversationKey(privateKey, data.pubkey)
    )
  );

const createRumor = (event: Partial<UnsignedEvent>, privateKey: Uint8Array) => {
  const rumor = {
    created_at: now(),
    content: '',
    tags: [],
    ...event,
    pubkey: getPublicKey(privateKey),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  rumor.id = getEventHash(rumor);

  return rumor as Rumor;
};

const createSeal = (
  rumor: Rumor,
  privateKey: Uint8Array,
  recipientPublicKey: string
) => {
  return finalizeEvent(
    {
      kind: 13,
      content: nip44Encrypt(rumor, privateKey, recipientPublicKey),
      created_at: randomNow(),
      tags: [],
    },
    privateKey
  ) as Event;
};

const createWrap = (event: Event, recipientPublicKey: string) => {
  const randomKey = generateSecretKey();

  return finalizeEvent(
    {
      kind: 1059,
      content: nip44Encrypt(event, randomKey, recipientPublicKey),
      created_at: randomNow(),
      tags: [['p', recipientPublicKey]],
    },
    randomKey
  ) as Event;
};

export const encryptMessage = (
  msg: string,
  senderPrivateKey: Uint8Array,
  recipientPublicKey: string
) => {
  const rumor = createRumor(
    {
      kind: 1,
      content: msg,
    },
    senderPrivateKey
  );

  const seal = createSeal(rumor, senderPrivateKey, recipientPublicKey);
  const wrap = createWrap(seal, recipientPublicKey);

  return wrap;
};

export const decryptMessage = (
  wrap: Event,
  recipientPrivateKey: Uint8Array
): string => {
  try {
    const unwrappedSeal = nip44Decrypt(wrap, recipientPrivateKey);
    const unsealedRumor = nip44Decrypt(unwrappedSeal, recipientPrivateKey);

    if (unsealedRumor.kind !== 1) {
      return 'Unknown message type';
    }

    return unsealedRumor.content;
  } catch (error) {
    return 'Error decrypting message';
  }
};

