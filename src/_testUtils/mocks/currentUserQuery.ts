import { GET_CURRENT_USER } from '../../_graphql/queries/getCurrentUser'

/**
 * Convenience mocks for when the currentUser query needs to be present
 * in mocks, but it's not necessary to actually assert that it was
 * called.
 */
export const currentUserQueryMock = {
  request: {
    query: GET_CURRENT_USER,
  },
  result: {
    data: {
      currentUser: {
        id: 'fake',
        email: 'test@test.com',
        firstName: 'Current',
        lastName: 'User',
      },
    },
  },
}

export const currentUserNullQueryMock = {
  request: {
    query: GET_CURRENT_USER,
  },
  result: {
    data: {
      currentUser: null,
    },
  },
}
