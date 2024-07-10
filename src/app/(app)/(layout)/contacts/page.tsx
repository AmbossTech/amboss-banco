import { cookies } from 'next/headers';

import { EventHandler } from '@/components/events/Events';
import { Contacts } from '@/views/contacts/Contacts';

export default function Page() {
  const eventsUrl = process.env.EVENTS_URL;

  const cookieStore = cookies();
  const accessToken = cookieStore.get('amboss_banco_access_token')?.value;

  return (
    <>
      {accessToken && eventsUrl ? (
        <EventHandler accessToken={accessToken} eventsUrl={eventsUrl} />
      ) : null}
      <Contacts />
    </>
  );
}
