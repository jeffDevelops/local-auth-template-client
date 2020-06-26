import React, { FC } from 'react'
import { Router, Redirect as MockRedirect } from '@reach/router'
import { waitFor, cleanup } from '@testing-library/react'
import { renderWithRouter } from '../../../_testUtils/renderWithRouter'
import AuthenticatedRoute from './AuthenticatedRoute'
import UserProvider from '../../../_context/User'
import { MockedProvider, MockedResponse } from '@apollo/react-testing'
import { GET_CURRENT_USER } from '../../../_graphql/queries/getCurrentUser'

const TestComponent = () => <>TEST COMPONENT</>

jest.mock('@reach/router', () => {
  const RouterMocks = jest.requireActual('@reach/router')
  return {
    ...RouterMocks,
    Redirect: jest.fn().mockImplementation(() => {
      return <>REDIRECT COMPONENT</>
    }),
  }
})

const renderAuthRoute = (mocks: MockedResponse[], route: string = '/') =>
  renderWithRouter(
    <MockedProvider mocks={mocks} addTypename={false}>
      <UserProvider>
        <Router>
          <AuthenticatedRoute path="/test" component={TestComponent} />
        </Router>
      </UserProvider>
    </MockedProvider>,
    { route }
  )

describe('<AuthenticatedRoute />', () => {
  afterEach(cleanup)

  it('renders the test component if authenticated (if a user object present in context)', async () => {
    let currentUserQueryCalled = false
    const currentUserQueryMock = {
      request: {
        query: GET_CURRENT_USER,
      },
      result: () => {
        currentUserQueryCalled = true
        return {
          data: {
            currentUser: {
              id: 'fake',
              email: 'test@test.com',
              firstName: 'Current',
              lastName: 'User',
            },
          },
        }
      },
    }

    const {
      debug,
      getByText,
      getByTestId,
      history: { navigate },
    } = renderAuthRoute([currentUserQueryMock])

    await waitFor(() => {
      expect(currentUserQueryCalled).toBe(true)
    })

    await navigate('/test')

    expect(getByText('TEST COMPONENT')).toBeInTheDocument()
  })

  it('redirects if not authenticated (if a user object not present in context', async () => {
    let currentUserNullQueryCalled = false
    const currentUserNullQueryMock = {
      request: {
        query: GET_CURRENT_USER,
      },
      result: () => {
        currentUserNullQueryCalled = true
        return {
          data: {
            currentUser: null,
          },
        }
      },
    }

    const {
      getByTestId,
      queryByText,
      getByText,
      history: { navigate },
    } = renderAuthRoute([currentUserNullQueryMock])

    await waitFor(() => expect(currentUserNullQueryCalled).toBe(true))
    await navigate('/test')

    expect(queryByText('TEST COMPONENT')).not.toBeInTheDocument()
    expect(MockRedirect).toHaveBeenCalledTimes(1)
    expect(getByText('REDIRECT COMPONENT')).toBeInTheDocument()
  })

  it('renders the loader when the UserContext is loading', async () => {
    let currentUserNullQueryCalled = false
    const currentUserNullQueryMock = {
      request: {
        query: GET_CURRENT_USER,
      },
      result: () => {
        currentUserNullQueryCalled = true
        return {
          data: {
            currentUser: null,
          },
        }
      },
    }

    const { getByTestId, queryByTestId } = renderAuthRoute(
      [currentUserNullQueryMock],
      '/test'
    )

    expect(getByTestId('auth_loader')).toBeInTheDocument()

    await waitFor(() => {
      expect(currentUserNullQueryCalled).toBe(true)
    })

    expect(queryByTestId('auth_loader')).toBeNull()
  })
})
