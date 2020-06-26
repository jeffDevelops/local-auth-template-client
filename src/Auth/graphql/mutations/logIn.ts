import gql from 'graphql-tag'

export const LOG_IN = gql`
  mutation login($input: LoginInput!) {
    login(input: $input) {
      id
      firstName
      lastName
      email
    }
  }
`
