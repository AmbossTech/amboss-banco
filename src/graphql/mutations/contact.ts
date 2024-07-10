import { gql } from '@apollo/client';

export const CreateContact = gql`
  mutation CreateContact($input: CreateContactInput!) {
    contacts {
      create(input: $input) {
        id
        money_address
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
