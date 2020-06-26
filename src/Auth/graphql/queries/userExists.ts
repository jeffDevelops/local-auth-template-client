import gql from 'graphql-tag'

export const USER_EXISTS = gql`
  query userExists($input: UserExistsInput!) {
    userExists(input: $input)
  }
`
