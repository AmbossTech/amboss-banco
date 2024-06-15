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
            money_address
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
          protected_encryption_private_key
        }
        contacts {
          id
          find_one(id: $contact_id) {
            id
            money_address
            encryption_pubkey
            payment_options {
              id
              name
              code
              network
              symbol
              min_sendable
              max_sendable
              decimals
              fixed_fee
              variable_fee_percentage
            }
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
              payload
            }
          }
        }
      }
    }
  }
`;
