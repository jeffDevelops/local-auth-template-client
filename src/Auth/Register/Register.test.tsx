import React from 'react'
import * as ReachRouter from '@reach/router'
import {
  waitFor,
  fireEvent,
  RenderResult,
  cleanup,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../../_testUtils/renderWithRouter'
import UserProvider from '../../_context/User'
import { MockedProvider, MockedResponse } from '@apollo/react-testing'
import { REGISTER } from '../graphql/mutations/register'
import { USER_EXISTS } from '../graphql/queries/userExists'
import Register, { errorMessages } from './Register'
import LogIn from '../LogIn/LogIn'
import { currentUserNullQueryMock } from '../../_testUtils/mocks/currentUserQuery'
import { RegisterInput } from '../types/interfaces/inputs/RegisterInput'

interface ErrorMatchers {
  [key: string]: RegExp
}

const errorMatchers = Object.keys(errorMessages).reduce(
  (acc: ErrorMatchers, current: keyof typeof errorMessages) => {
    acc[current] = new RegExp(errorMessages[current], 'i')
    return acc
  },
  {}
)

// Spaces added to ensure inputs trimmed
const VALID_INPUT: RegisterInput = {
  firstName: 'Test',
  lastName: 'Testerson',
  email: 'test@test.com',
  password: '1A!2B@3C#',
}

const renderRegister = (mocks: MockedResponse[], route: string = '/register') =>
  renderWithRouter(
    <MockedProvider mocks={mocks} addTypename={false}>
      <UserProvider>
        <ReachRouter.Router>
          <Register path="/register" />
          <LogIn path="/log-in" />
        </ReachRouter.Router>
      </UserProvider>
    </MockedProvider>,
    { route }
  )

const assertNoErrorsVisible = ({ queryByText }: RenderResult) => {
  expect(queryByText(errorMatchers.firstNameRequiredError)).toBeNull()
  expect(queryByText(errorMatchers.lastNameRequiredError)).toBeNull()
  expect(queryByText(errorMatchers.emailRequiredError)).toBeNull()
  expect(queryByText(errorMatchers.emailInvalidError)).toBeNull()
  expect(queryByText(errorMatchers.emailAlreadyExistsError)).toBeNull()
  expect(queryByText(errorMatchers.passwordRequiredError)).toBeNull()
  expect(queryByText(errorMatchers.confirmPasswordRequiredError)).toBeNull()
  expect(queryByText(errorMatchers.passwordInputNotSixChars)).toBeNull()
  expect(queryByText(errorMatchers.confirmPasswordRequiredError)).toBeNull()
  expect(queryByText(errorMatchers.passwordInputsDoNotMatchError)).toBeNull()
}

describe('<Register />', () => {
  afterEach(cleanup)
  it('validates the first name after attempted submission', async () => {
    const renderer = renderRegister([currentUserNullQueryMock])
    const { getByLabelText, getByText, queryByText } = renderer

    const input = getByLabelText(/First Name/i) as HTMLInputElement

    // Canary
    expect(input.value).toBe('')
    assertNoErrorsVisible(renderer)

    // Act
    const submitButton = getByText(/Register/i) as HTMLButtonElement
    userEvent.click(submitButton)

    // Assert validation
    await waitFor(() =>
      expect(
        getByText(errorMatchers.firstNameRequiredError)
      ).toBeInTheDocument()
    )

    // Act
    userEvent.type(input, VALID_INPUT.firstName)
    await waitFor(() =>
      expect(queryByText(errorMatchers.firstNameRequiredError)).toBeNull()
    )

    // Ensure that the validation message comes back when the input is empty again
    fireEvent.change(input, { target: { value: '' } })
    await waitFor(() =>
      expect(
        getByText(errorMatchers.firstNameRequiredError)
      ).toBeInTheDocument()
    )

    // Enter the valid value again
    userEvent.type(input, VALID_INPUT.lastName)
    await waitFor(() =>
      expect(queryByText(errorMatchers.firstNameRequiredError)).toBeNull()
    )
  })

  it('validates the last name after attempted submission', async () => {
    const renderer = renderRegister([currentUserNullQueryMock])
    const { getByLabelText, getByText, queryByText } = renderer

    const input = getByLabelText(/Last Name/i) as HTMLInputElement

    // Canary
    expect(input.value).toBe('')
    assertNoErrorsVisible(renderer)

    // Act
    const submitButton = getByText(/Register/i) as HTMLButtonElement
    userEvent.click(submitButton)

    // Assert validation
    await waitFor(() =>
      expect(getByText(errorMatchers.lastNameRequiredError)).toBeInTheDocument()
    )

    // Act
    userEvent.type(input, VALID_INPUT.lastName)
    await waitFor(() =>
      expect(queryByText(errorMatchers.lastNameRequiredError)).toBeNull()
    )

    // Ensure that the validation message comes back when the input is empty again
    fireEvent.change(input, { target: { value: '' } })
    await waitFor(() =>
      expect(getByText(errorMatchers.lastNameRequiredError)).toBeInTheDocument()
    )

    // Enter the valid value again
    userEvent.type(input, VALID_INPUT.lastName)
    await waitFor(() =>
      expect(queryByText(errorMatchers.lastNameRequiredError)).toBeNull()
    )
  })

  it('validates the email field after attempted submission', async () => {
    const alreadyExistentEmail = 't@t.co'
    let userDoesExistQueryCalled = false
    const userDoesExistQueryMock = {
      request: {
        query: USER_EXISTS,
        variables: {
          input: {
            email: alreadyExistentEmail,
          },
        },
      },
      result: () => {
        userDoesExistQueryCalled = true
        return {
          data: {
            userExists: true,
          },
        }
      },
    }

    let userDoesNotYetExistQueryCalled = false
    const userDoesNotYetExistQueryMock = {
      request: {
        query: USER_EXISTS,
        variables: {
          input: {
            email: VALID_INPUT.email,
          },
        },
      },
      result: () => {
        userDoesNotYetExistQueryCalled = true
        return {
          data: {
            userExists: false,
          },
        }
      },
    }

    const renderer = renderRegister([
      currentUserNullQueryMock,
      userDoesExistQueryMock,
      userDoesNotYetExistQueryMock,
      userDoesNotYetExistQueryMock,
    ])
    const { getByLabelText, getByText, queryByText, getByTestId } = renderer

    const input = getByLabelText(/Email/i) as HTMLInputElement

    // Canary
    expect(input.value).toBe('')

    // Act
    userEvent.type(input, VALID_INPUT.email)

    await waitFor(() =>
      expect(getByTestId('email_check_loading')).toBeInTheDocument()
    )

    await waitFor(() => {
      expect(userDoesNotYetExistQueryCalled).toBe(true)
    })

    // Ensure that the validation message comes back when the input is empty again
    fireEvent.change(input, { target: { value: '' } })

    userEvent.click(getByText(/Register/i))

    await waitFor(() =>
      expect(getByText(errorMatchers.emailRequiredError)).toBeInTheDocument()
    )

    // Ensure email validation works and ensure backend duplicate account verification is handled
    // NOTE: space added to ensure input trimming
    userEvent.type(input, ' t@t.co')
    await waitFor(() =>
      expect(getByTestId('email_check_loading')).toBeInTheDocument()
    )
    await waitFor(() => {
      expect(userDoesExistQueryCalled).toBe(true)
      expect(queryByText(errorMatchers.emailInvalidError)).toBeNull()
      expect(
        getByText(errorMatchers.emailAlreadyExistsError)
      ).toBeInTheDocument()
    })

    // Ensure input trimmed
    userEvent.type(input, ` ${VALID_INPUT.email} `)

    await waitFor(() => {
      expect(userDoesNotYetExistQueryCalled).toBe(true)
      expect(queryByText(errorMatchers.emailInvalidError)).toBeNull()
      expect(queryByText(errorMatchers.emailRequiredError)).toBeNull()
      expect(queryByText(errorMatchers.emailAlreadyExistsError)).toBeNull()
    })
  })

  it('validates the password field after attempted submission', async () => {
    const renderer = renderRegister([currentUserNullQueryMock])
    const { getByLabelText, getByText, queryByText } = renderer

    const input = getByLabelText(/^Password$/i) as HTMLInputElement

    // Canary
    expect(input.value).toBe('')
    assertNoErrorsVisible(renderer)

    // Act
    const submitButton = getByText(/Register/i) as HTMLButtonElement
    userEvent.click(submitButton)

    // Assert validation
    await waitFor(() =>
      expect(getByText(errorMatchers.passwordRequiredError)).toBeInTheDocument()
    )

    // Ensure password length validation occurs
    userEvent.type(input, '12345')
    await waitFor(() =>
      expect(
        getByText(errorMatchers.passwordInputNotSixChars)
      ).toBeInTheDocument()
    )

    // Ensure password length validation occurs
    userEvent.type(input, '123456')
    await waitFor(() =>
      expect(queryByText(errorMatchers.passwordInputNotSixChars)).toBeNull()
    )

    // Act
    userEvent.type(input, VALID_INPUT.password)
    await waitFor(() =>
      expect(queryByText(errorMatchers.passwordRequiredError)).toBeNull()
    )
  })

  it('ensures that the confirm password input and password input are equal', async () => {
    const renderer = renderRegister([currentUserNullQueryMock])
    const { getByLabelText, getByText, queryByText } = renderer

    const passwordInput = getByLabelText(/^Password$/i) as HTMLInputElement
    const confirmInput = getByLabelText(/Confirm password/i) as HTMLInputElement

    // Canary
    expect(passwordInput.value).toBe('')
    expect(confirmInput.value).toBe('')
    assertNoErrorsVisible(renderer)

    // Act
    const submitButton = getByText(/Register/i)
    userEvent.click(submitButton)

    await waitFor(() =>
      expect(
        getByText(errorMatchers.confirmPasswordRequiredError)
      ).toBeInTheDocument()
    )

    userEvent.type(passwordInput, VALID_INPUT.password)
    userEvent.type(confirmInput, 'oops')

    await waitFor(() =>
      expect(
        getByText(errorMatchers.passwordInputsDoNotMatchError)
      ).toBeInTheDocument()
    )

    userEvent.type(confirmInput, VALID_INPUT.password)

    await waitFor(() => {
      expect(queryByText(errorMatchers.confirmPasswordRequiredError)).toBeNull()
      expect(
        queryByText(errorMatchers.passwordInputsDoNotMatchError)
      ).toBeNull()
    })
  })

  it('allows the user to enter all of the inputs correctly and submit the form', async () => {
    const navigationSpy = jest.spyOn(ReachRouter, 'navigate')

    let registerMutationMockWasCalled = false
    const registerMutationMock = {
      request: {
        query: REGISTER,
        variables: {
          input: { ...VALID_INPUT },
        },
      },
      result: () => {
        registerMutationMockWasCalled = true
        const responsePayload = { ...VALID_INPUT }
        delete responsePayload.password
        return {
          data: {
            register: {
              id: 'uuid',
              ...responsePayload,
            },
          },
        }
      },
    }

    let userDoesNotYetExistQueryCalled = false
    const userDoesNotYetExistQueryMock = {
      request: {
        query: USER_EXISTS,
        variables: {
          input: {
            email: VALID_INPUT.email,
          },
        },
      },
      result: () => {
        userDoesNotYetExistQueryCalled = true
        return {
          data: {
            userExists: false,
          },
        }
      },
    }

    const renderer = renderRegister([
      currentUserNullQueryMock,
      userDoesNotYetExistQueryMock,
      registerMutationMock,
    ])

    const { getByLabelText, getByText, queryByTestId, getByTestId } = renderer

    const firstNameInput = getByLabelText(/First Name/i) as HTMLInputElement
    const lastNameInput = getByLabelText(/Last Name/i) as HTMLInputElement
    const emailInput = getByLabelText(/Email/i) as HTMLInputElement
    const passwordInput = getByLabelText(/^Password$/i) as HTMLInputElement
    const confirmInput = getByLabelText(/Confirm password/i) as HTMLInputElement
    const submitButton = getByText(/Register/i)

    // CANARY: expect all inputs to be empty
    expect(firstNameInput.value).toBe('')
    expect(lastNameInput.value).toBe('')
    expect(emailInput.value).toBe('')
    expect(passwordInput.value).toBe('')
    expect(confirmInput.value).toBe('')

    // CANARY: expect validation errors not to be displayed
    assertNoErrorsVisible(renderer)

    // ACT
    userEvent.type(firstNameInput, VALID_INPUT.firstName)
    userEvent.type(lastNameInput, VALID_INPUT.lastName)
    userEvent.type(emailInput, VALID_INPUT.email)
    userEvent.type(passwordInput, VALID_INPUT.password)
    userEvent.type(confirmInput, VALID_INPUT.password)

    await waitFor(() => {
      expect(getByTestId('email_check_loading')).toBeInTheDocument()
    })

    await waitFor(() => {
      assertNoErrorsVisible(renderer)
      expect(queryByTestId('email_check_loading')).toBeNull()
    })

    userEvent.click(submitButton)

    // Wait for the userExistsQuery to finish and for the button to be enabled

    await waitFor(() => {
      expect(registerMutationMockWasCalled).toBe(true)
      expect(navigationSpy).toHaveBeenCalledTimes(1)
      expect(navigationSpy).toHaveBeenCalledWith('/')
    })
  })

  it('renders a link to /log-in as an option if the user already has an account', async () => {
    const { getByText, getByTestId } = renderRegister([
      currentUserNullQueryMock,
    ])

    expect(getByText(/Already have an account\?/i)).toBeInTheDocument()
    const link = getByText(/Log in/i)

    userEvent.click(link)

    await waitFor(() => {
      expect(getByTestId('logIn_form')).toBeInTheDocument()
    })
  })
})
