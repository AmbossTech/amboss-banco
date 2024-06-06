import { gql } from '@apollo/client';

export const GetWalletContacts = gql`
  query getWalletContacts($id: String!) {
    wallets {
      id
      find_one(id: $id) {
        id
        contacts {
          id
          find_many {
            id
            lightning_address
          }
        }
      }
    }
  }
`;

export const GetWalletContact = gql`
  query getWalletContact($id: String!, $contact_id: String!) {
    wallets {
      id
      find_one(id: $id) {
        id
        secp256k1_key_pair {
          id
          encryption_pubkey
        }
        contacts {
          id
          find_one(id: $contact_id) {
            id
            lightning_address
            encryption_pubkey
          }
        }
      }
    }
  }
`;

export const GetWalletContactMessages = gql`
  query getWalletContactMessages($id: String!, $contact_id: String!) {
    wallets {
      id
      find_one(id: $id) {
        id
        secp256k1_key_pair {
          id
          protected_encryption_private_key
        }
        contacts {
          id
          find_one(id: $contact_id) {
            id
            messages {
              id
              contact_is_sender
              protected_message
            }
          }
        }
      }
    }
  }
`;
