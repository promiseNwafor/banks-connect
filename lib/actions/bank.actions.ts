'use server'

import { CountryCode } from 'plaid'

import { parseStringify } from '../utils'

export const createLinkToken = async (user: User) => {
  try {
    // const tokenParams = {
    //   user: {
    //     client_user_id: user.$id,
    //   },
    //   client_name: `${user.firstName} ${user.lastName}`,
    //   products: ['auth'] as Products[],
    //   language: 'en',
    //   country_codes: ['US'] as CountryCode[],
    // }
    // const response = await plaidClient.linkTokenCreate(tokenParams)
    // return parseStringify({ linkToken: response.data.link_token })
  } catch (error) {
    console.log(error)
  }
}

export const exchangePublicToken = async ({ publicToken, user }: exchangePublicTokenProps) => {
  try {
  } catch (error) {
    console.error('An error occurred while creating exchanging token:', error)
  }
}
