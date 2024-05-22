import { ApolloError } from '@apollo/client';

export const handleApolloError = ({ graphQLErrors }: ApolloError): string[] => {
  const messages: string[] = [];

  if (graphQLErrors && graphQLErrors.length) {
    graphQLErrors.forEach((e: any) => {
      const messageType = typeof e?.extensions?.response?.message;

      if (messageType === 'string') {
        const message = e.extensions.response.message;
        messages.push(message);
      }

      if (e?.extensions?.originalError?.message?.length) {
        e.extensions.originalError.message.forEach((message: string) =>
          messages.push(message)
        );
      }

      if (e?.extensions?.response?.message?.length) {
        e?.extensions?.response?.message.forEach((message: string) =>
          messages.push(message)
        );
      }

      messages.push(e.message);
    });
  }

  return messages;
};
