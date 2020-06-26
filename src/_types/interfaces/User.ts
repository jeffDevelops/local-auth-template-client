import { BaseRecord } from './_BaseRecord'

interface User {
  email: string
}

export type DBUser = BaseRecord & User
