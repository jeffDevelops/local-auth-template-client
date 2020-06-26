import React, {
  FC,
  useState,
  useCallback,
  useContext,
  useEffect,
  ChangeEvent,
} from 'react'
import { RouteComponentProps, navigate, Link } from '@reach/router'
import { useMutation } from '@apollo/react-hooks'
import { ApolloQueryResult } from 'apollo-client'

import { useDebounce } from '../../_hooks/useDebounce'
import { useImperativeQuery } from '../../_hooks/useImperativeQuery'
import { UserContext } from '../../_context/User'
import { USER_EXISTS } from '../graphql/queries/userExists'
import { REGISTER } from '../graphql/mutations/register'
import {
  firstNameSchema,
  lastNameSchema,
  passwordSchema,
  confirmPasswordSchema,
  validateEmailOnClient,
} from './inputSchema'
import { Input, Label } from '../styled'

export const errorMessages: { [key: string]: string } = {
  firstNameRequiredError: 'Please provide your first name',
  lastNameRequiredError: 'Please provide your last name',
  emailRequiredError: 'Please provide your email',
  emailInvalidError: 'Please provide a valid email',
  emailAlreadyExistsError:
    'That email already exists in our records. Please log in, or create an account with a different email.',
  passwordRequiredError: 'Please provide a password',
  passwordInputNotSixChars:
    'Please create a password that is at least 6 characters',
  confirmPasswordRequiredError: 'Please confirm your password',
  passwordInputsDoNotMatchError: "Password inputs don't match",
}

interface Inputs {
  firstName: string
  lastName: string
  password: string
  confirmPassword: string
}

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
}

const initialErrorState = {
  firstName: errorMessages.firstNameRequiredError,
  lastName: errorMessages.lastNameRequiredError,
  password: errorMessages.passwordRequiredError,
  confirmPassword: errorMessages.confirmPasswordRequiredError,
}

const emailTakenError =
  'That email already exists in our records. Please log in, or create an account with a different email.'

const clientSideValidateEmail = async (email: string) => {
  // Pre-validate the string client-side
  const validationErrors = await validateEmailOnClient(email)
  if (!!validationErrors) {
    return validationErrors
  }
  return ''
}

const Register: FC<RouteComponentProps> = () => {
  const { setUser } = useContext(UserContext)

  const [inputs, setInputs] = useState<Inputs>(initialState)
  const [errors, setErrors] = useState<Inputs>(initialErrorState)
  const [didAttemptSubmit, setDidAttemptSubmit] = useState(false)

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState(errorMessages.emailRequiredError)
  const debouncedEmail = useDebounce(email, 300)
  const [emailConfirmation, setEmailConfirmation] = useState<{
    email: string
    confirmed: boolean
  }>({ email: initialState.email, confirmed: false })
  const [emailValidationLoading, setEmailValidationLoading] = useState(false)

  const userExistsQuery = useImperativeQuery(USER_EXISTS)
  const [registerMutation] = useMutation(REGISTER)

  const serverSideValidateEmail = useCallback(
    async (
      email: string,
      userExistsQuery: (
        variables?: Record<string, any> | undefined
      ) => Promise<ApolloQueryResult<any>>
    ): Promise<string> => {
      return userExistsQuery({
        input: {
          email: email.trim(),
        },
      }).then((response: ApolloQueryResult<any>) =>
        response.data.userExists ? emailTakenError : ''
      )
    },
    []
  )

  // Invalidate the emailError when the input changes
  useEffect(() => {
    setEmailError('')
  }, [debouncedEmail])

  useEffect(() => {
    // If the email has already been confirmed on the server, we don't care about validating it
    if (
      !emailValidationLoading &&
      !emailError &&
      debouncedEmail !== emailConfirmation.email
    ) {
      setEmailValidationLoading(true)
      clientSideValidateEmail(debouncedEmail)
        .then((error) => {
          if (!error) {
            serverSideValidateEmail(debouncedEmail, userExistsQuery).then(
              (error) => {
                if (error !== emailError) setEmailError(error)
                setEmailConfirmation({
                  confirmed: !!error ? false : true,
                  email: debouncedEmail.trim(),
                })
                setEmailValidationLoading(false)
              }
            )
          } else {
            setEmailValidationLoading(false)
            if (error !== emailError) setEmailError(error)
          }
        })
        .catch((error) => console.error(error))
    }
  }, [
    userExistsQuery,
    emailValidationLoading,
    debouncedEmail,
    emailError,
    emailConfirmation.email,
    serverSideValidateEmail,
  ])

  const validate = useCallback(
    async (inputs: Inputs): Promise<Inputs> => {
      return Promise.all([
        firstNameSchema
          .validate(inputs.firstName)
          .then(() => '')
          .catch((error) => error.message),
        lastNameSchema
          .validate(inputs.lastName)
          .then(() => '')
          .catch((error) => error.message),
        passwordSchema
          .validate(inputs.password)
          .then(() => '')
          .catch((error) => error.message),
        confirmPasswordSchema(inputs.password)
          .validate(inputs.confirmPassword)
          .then(() => '')
          .catch((error) => error.message),
      ]).then((validationResults) => {
        return {
          ...errors,
          firstName: validationResults[0],
          lastName: validationResults[1],
          password: validationResults[2],
          confirmPassword: validationResults[3],
        }
      })
    },
    [errors]
  )

  const handleInputChange = useCallback(
    async (name: string, value: string) => {
      setInputs({
        ...inputs,
        [name]: value,
      })
      validate({ ...inputs, [name]: value }).then((result) => setErrors(result))
    },
    [setInputs, inputs, validate]
  )

  const handleSubmit = useCallback(() => {
    // Display any errors that exist
    setDidAttemptSubmit(true)

    // Ensure all inputs valid
    if (Object.values(errors).filter((err) => !!err).length > 0) {
      return
    }

    const mutationInput = { ...inputs, email: debouncedEmail }
    delete mutationInput.confirmPassword

    registerMutation({ variables: { input: mutationInput } })
      .then((response) => {
        if (response?.data?.register) {
          setUser(response.data.register)
          navigate('/')
        }
      })
      .catch((error) => console.error(error))
  }, [inputs, debouncedEmail, errors, registerMutation, setUser])

  return (
    <form
      data-testid="register_form"
      onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        handleSubmit()
      }}
    >
      <Label htmlFor="register_firstName">First Name</Label>
      <Input
        id="register_firstName"
        type="text"
        name="firstName"
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(e.target.name, e.target.value)
        }
        value={inputs.firstName}
      />
      {didAttemptSubmit && errors.firstName && <div>{errors.firstName}</div>}

      <Label htmlFor="register_lastName">Last Name</Label>
      <Input
        id="register_lastName"
        type="text"
        name="lastName"
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(e.target.name, e.target.value)
        }
        value={inputs.lastName}
      />
      {didAttemptSubmit && errors.lastName && <div>{errors.lastName}</div>}

      <Label htmlFor="register_email">Email</Label>
      <Input
        id="register_email"
        type="text"
        name="email"
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setEmail(e.target.value)
        }
        value={email}
      />
      {emailValidationLoading && (
        <div data-testid="email_check_loading">Validating...</div>
      )}
      {didAttemptSubmit &&
        !emailValidationLoading &&
        emailError &&
        emailError !== emailTakenError && <div>{emailError}</div>}
      {!emailValidationLoading && emailError === emailTakenError && (
        <div>{emailError}</div>
      )}

      <Label htmlFor="register_password">Password</Label>
      <Input
        id="register_password"
        type="password"
        name="password"
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(e.target.name, e.target.value)
        }
        value={inputs.password}
      />
      {didAttemptSubmit && errors.password && <div>{errors.password}</div>}

      <Label htmlFor="register_confirm_password">Confirm Password</Label>
      <Input
        id="register_confirm_password"
        type="password"
        name="confirmPassword"
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(e.target.name, e.target.value)
        }
        value={inputs.confirmPassword}
      />
      {didAttemptSubmit && errors.confirmPassword && (
        <div>{errors.confirmPassword}</div>
      )}

      <button
        disabled={
          didAttemptSubmit &&
          // Any validation errors exist
          Object.values(errors).map((val) => !!val).length > 0 &&
          // Validating email on the server
          (emailValidationLoading ||
            (!emailConfirmation.confirmed &&
              emailConfirmation.email === debouncedEmail))
        }
        type="submit"
      >
        Register
      </button>

      <p>
        Already have an account? <Link to="/log-in">Log In</Link>
      </p>
    </form>
  )
}

export default Register
