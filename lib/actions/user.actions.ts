'use server'

import { ID, Query } from 'node-appwrite'
import { cookies } from 'next/headers'
import { encryptId, extractCustomerIdFromUrl, parseStringify } from '../utils'
import {
  CountryCode,
  ProcessorTokenCreateRequest,
  ProcessorTokenCreateRequestProcessorEnum,
  Products,
} from 'plaid'

// import { plaidClient } from '@/lib/plaid';
import { revalidatePath } from 'next/cache'
import { addFundingSource, createDwollaCustomer } from './dwolla.actions'

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
  APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env

export const signIn = async ({ email, password }: signInProps) => {
  try {
  } catch (error) {
    console.error('Error', error)
  }
}

export const signUp = async ({ email, password }: signInProps) => {
  try {
  } catch (error) {
    console.error('Error', error)
  }
}
