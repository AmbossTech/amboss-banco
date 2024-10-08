import { gql } from '@apollo/client';

export const getPricesHistorical = gql`
  query getPricesHistorical($input: PriceChartInput!) {
    prices {
      id
      historical(input: $input) {
        id
        interval
        points {
          currency
          date
          id
          value
        }
      }
    }
  }
`;

export const getPriceCurrent = gql`
  query getPriceCurrent {
    prices {
      current {
        currency
        date
        id
        value
      }
      id
    }
  }
`;
