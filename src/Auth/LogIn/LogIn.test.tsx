import React from 'react'
import * as ReachRouter from '@reach/router'
import { RenderResult, waitFor } from '@testing-library/react'
import { renderWithRouter } from '../../_testUtils/renderWithRouter'
import userEvent from '@testing-library/user-event'
import LogIn from './LogIn'
import Home from '../../Home/Home'
import Register from '../Register/Register'
import { MockedProvider, MockedResponse } from '@apollo/react-testing'
import { LOG_IN } from '../graphql/mutations/logIn'
import { LogInInput } from '../types/interfaces/inputs/LogInInput'
import UserProvider from '../../_context/User'
import { currentUserNullQueryMock } from '../../_testUtils/mocks/currentUserQuery'

const VALID_INPUT: LogInInput = {
  input: {
    email: 'test@test.com',
    password: 'supersecretpassword',
  },
}

const INVALID_INPUT: LogInInput = {
  input: {
    email: 'wrong@wrong.com',
    password: 'ah-ah-ahhhh',
  },
}

const renderLogIn = (mocks: MockedResponse[]) =>
  renderWithRouter(
    <MockedProvider mocks={mocks} addTypename={false}>
      <UserProvider>
        <ReachRouter.Router>
          <LogIn path="/log-in" />
          <Register path="/register" />
          <Home path="/" />
        </ReachRouter.Router>
      </UserProvider>
    </MockedProvider>,
    { route: '/log-in' }
  )

const act = (renderer: RenderResult, input: LogInInput) => {
  const emailInput = renderer.getByLabelText(/email/i) as HTMLInputElement
  const passwordInput = renderer.getByLabelText(/password/i) as HTMLInputElement

  // Canary: expect inputs to be empty initially
  expect(emailInput.value).toBe('')
  expect(passwordInput.value).toBe('')

  userEvent.type(emailInput, input.input.email)
  userEvent.type(passwordInput, input.input.password)

  const logInButton = renderer.getByText(/log in/i)

  userEvent.click(logInButton)
}

describe('<LogIn />', () => {
  afterEach(() => jest.clearAllMocks())

  it('allows the user to log in', async () => {
    // Setup spies and mocks
    const navigationSpy = jest.spyOn(ReachRouter, 'navigate')
    let signUpMockCalled = false

    const signUpMock = {
      request: {
        query: LOG_IN,
        variables: VALID_INPUT,
      },
      result: () => {
        signUpMockCalled = true
        return {
          data: {
            login: {
              id: 'id',
              email: VALID_INPUT.input.email,
              firstName: 'Valid',
              lastName: 'Input',
            },
          },
        }
      },
    }

    const renderer = renderLogIn([currentUserNullQueryMock, signUpMock])

    act(renderer, VALID_INPUT)

    await waitFor(() => {
      expect(navigationSpy).toHaveBeenCalledTimes(1)
      expect(navigationSpy).toHaveBeenCalledWith('/')
      expect(signUpMockCalled).toBe(true)
    })
  })

  it('presents an error when the user provides incorrect credentials', async () => {
    // Setup spies and mocks
    const navigationSpy = jest.spyOn(ReachRouter, 'navigate')
    let invalidSignUpMockCalled = false

    const invalidSignUpMock = {
      request: {
        query: LOG_IN,
        variables: INVALID_INPUT,
      },
      result: () => {
        invalidSignUpMockCalled = true
        return {
          data: {
            login: null, // API returns null, if no user matches
          },
        }
      },
    }

    const renderer = renderLogIn([currentUserNullQueryMock, invalidSignUpMock])

    act(renderer, INVALID_INPUT)

    await waitFor(() => {
      expect(navigationSpy).not.toHaveBeenCalled()
      expect(invalidSignUpMockCalled).toBe(true)
      expect(
        renderer.getByText(
          /A user with that email address and password could not be found. Please check your inputs and try again./i
        )
      ).toBeInTheDocument()
    })
  })

  it('renders a link to /register as an option if the user does not yet have an account', async () => {
    const { getByText, getByTestId } = renderLogIn([currentUserNullQueryMock])

    expect(getByText(/Don't have an account\?/i)).toBeInTheDocument()
    const link = getByText(/Register/i)

    userEvent.click(link)

    await waitFor(() => {
      expect(getByTestId('register_form')).toBeInTheDocument()
    })
  })
})
