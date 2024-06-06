import { gql } from '@apollo/client';

export const CreateContact = gql`
  mutation CreateContact($input: CreateContactInput!) {
    contacts {
      create(input: $input) {
        id
      }
    }
  }
`;

export const SendMessage = gql`
  mutation SendMessage($input: SendMessageInput!) {
    contacts {
      send_message(input: $input) {
        id
      }
    }
  }
`;
