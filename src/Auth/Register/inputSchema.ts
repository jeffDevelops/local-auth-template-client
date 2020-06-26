import { string } from 'yup'

export const firstNameSchema = string()
  .trim()
  .required('Please provide your first name')

export const lastNameSchema = string()
  .trim()
  .required('Please provide your last name')

export const emailSchema = string()
  .trim()
  .required('Please provide your email')
  .email('Please provide a valid email')

export const passwordSchema = string()
  .trim()
  .required('Please provide a password')
  .min(6, 'Please create a password that is at least 6 characters')

export const confirmPasswordSchema = (mustMatch: string) =>
  string()
    .trim()
    .required('Please confirm your password')
    .equals([mustMatch], "Password inputs don't match")

export const validateEmailOnClient = async (email: string) => {
  return await emailSchema
    .validate(email)
    .then(() => '')
    .catch((error) => error.message)
}
