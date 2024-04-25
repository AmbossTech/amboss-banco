import { ApolloError } from '@apollo/client';

export const handleError = (error: unknown) => {
  if (error instanceof ApolloError) {
    const { graphQLErrors } = error;
    if (graphQLErrors) {
      const errors = graphQLErrors.map(({ message }) => message);
      return errors.join(' ');
    }
  }
};
