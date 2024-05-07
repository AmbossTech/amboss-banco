import { gql } from '@apollo/client';

export const GetAllWallets = gql`
  query getAllWallets {
    wallets {
      id
      find_many {
        id
        name
        accounts {
          id
          name
          account_type
        }
      }
    }
  }
`;

export const GetWallet = gql`
  query getWallet($id: String!) {
    wallets {
      id
      find_one(id: $id) {
        id
        name
        accounts {
          id
          name
          account_type
          liquid_assets {
            id
            balance
            asset_id
            asset_info {
              id
              name
              is_featured
              precision
              ticker
            }
            transactions {
              id
              tx_id
              date
              fee
              block_height
              balance
              blinded_url
              unblinded_url
            }
          }
        }
      }
    }
  }
`;
