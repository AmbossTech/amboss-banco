'use client';

import { useApolloClient } from '@apollo/client';
import {
  EventStreamContentType,
  fetchEventSource,
} from '@microsoft/fetch-event-source';
import { FC, useCallback, useEffect } from 'react';

import { useToast } from '../ui/use-toast';

class RetriableError extends Error {}
class FatalError extends Error {}

export const EventHandler: FC<{
  accessToken: string;
  eventsUrl: string;
}> = ({ accessToken, eventsUrl }) => {
  const client = useApolloClient();
  const { toast } = useToast();

  const showToast = useCallback(
    (sender: string | undefined) => {
      if (!sender) return;
      toast({
        title: 'New Message',
        description: sender
          ? `You have a new message from ${sender}`
          : undefined,
      });
    },
    [toast]
  );

  useEffect(() => {
    const startSource = async () => {
      try {
        await fetchEventSource(`${eventsUrl}/contacts`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          async onopen(response) {
            if (
              response.ok &&
              response.headers.get('content-type') === EventStreamContentType
            ) {
              return;
            } else if (
              response.status >= 400 &&
              response.status < 500 &&
              response.status !== 429
            ) {
              throw new FatalError();
            } else {
              throw new RetriableError();
            }
          },
          onmessage(ev) {
            try {
              const parsed = JSON.parse(ev.data);
              showToast(parsed.sender_money_address);
            } catch (error) {}

            client.reFetchObservableQueries();
          },
          onclose() {
            throw new RetriableError();
          },
          onerror(err) {
            if (err instanceof FatalError) {
              throw err;
            } else {
              return 2000;
            }
          },
        });
      } catch (error) {}
    };

    startSource();
  }, [accessToken, client, showToast, eventsUrl]);

  return null;
};
