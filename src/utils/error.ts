import { ApolloError } from '@apollo/client';

export const handleApolloError = ({ graphQLErrors }: ApolloError): string[] => {
  const messages: string[] = [];

  if (graphQLErrors && graphQLErrors.length) {
    graphQLErrors.forEach(e => {
      messages.push(e.message);
    });
  }

  return messages;
};
