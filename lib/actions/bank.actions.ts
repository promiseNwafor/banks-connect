'use server'

import {
  CountryCode,
  ProcessorTokenCreateRequest,
  ProcessorTokenCreateRequestProcessorEnum,
  Products,
} from 'plaid'
import { revalidatePath } from 'next/cache'

import { encryptId, parseStringify } from '../utils'
import { plaidClient } from '../plaid'
import { addFundingSource } from './dwolla.actions'
import { createBankAccount, getBank, getBanks } from './user.actions'
import { getTransactionsByBankId } from './transaction.actions'

export const exchangePublicToken = async ({ publicToken, user }: exchangePublicTokenProps) => {
  try {
    // Exchange public token for access token and item ID
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    })

    const accessToken = response.data.access_token
    const itemId = response.data.item_id

    // Get account information from Plaid using the access token
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    })

    const accountData = accountsResponse.data.accounts[0]

    // Create a processor token for Dwolla using the access token and account ID
    const request: ProcessorTokenCreateRequest = {
      access_token: accessToken,
      account_id: accountData.account_id,
      processor: 'dwolla' as ProcessorTokenCreateRequestProcessorEnum,
    }

    const processorTokenResponse = await plaidClient.processorTokenCreate(request)
    const processorToken = processorTokenResponse.data.processor_token

    // Create a funding source URL for the account using the Dwolla customer ID, processor token, and bank name
    const fundingSourceUrl = await addFundingSource({
      dwollaCustomerId: user.dwollaCustomerId,
      processorToken,
      bankName: accountData.name,
    })

    // If the funding source URL is not created, throw an error
    if (!fundingSourceUrl) throw Error

    // Create a bank account using the user ID, item ID, account ID, access token, funding source URL, and shareableId ID
    await createBankAccount({
      userId: user.$id,
      bankId: itemId,
      accountId: accountData.account_id,
      accessToken,
      fundingSourceUrl,
      sharableId: encryptId(accountData.account_id),
    })

    // Revalidate the path to reflect the changes
    revalidatePath('/')

    // Return a success message
    return parseStringify({
      publicTokenExchange: 'complete',
    })
  } catch (error) {
    console.error('An error occurred while creating exchanging token:', error)
  }
}

export const createLinkToken = async (user: User) => {
  try {
    const tokenParams = {
      user: {
        client_user_id: user.$id,
      },
      client_name: `${user.firstName} ${user.lastName}`,
      products: ['auth'] as Products[],
      language: 'en',
      country_codes: ['US'] as CountryCode[],
    }

    const response = await plaidClient.linkTokenCreate(tokenParams)

    return parseStringify({ linkToken: response.data.link_token })
  } catch (error) {
    console.log(error)
  }
}

// Get multiple bank accounts
export const getAccounts = async ({ userId }: getAccountsProps) => {
  try {
    // get banks from db
    const banks = await getBanks({ userId })

    const accounts = await Promise.all(
      banks?.map(async (bank: Bank) => {
        // get each account info from plaid
        const accountsResponse = await plaidClient.accountsGet({
          access_token: bank.accessToken,
        })
        const accountData = accountsResponse.data.accounts[0]

        // get institution info from plaid
        const institution = await getInstitution({
          institutionId: accountsResponse.data.item.institution_id!,
        })

        const account = {
          id: accountData.account_id,
          availableBalance: accountData.balances.available!,
          currentBalance: accountData.balances.current!,
          institutionId: institution.institution_id,
          name: accountData.name,
          officialName: accountData.official_name,
          mask: accountData.mask!,
          type: accountData.type as string,
          subtype: accountData.subtype! as string,
          appwriteItemId: bank.$id,
          sharableId: bank.sharableId,
        }

        return account
      })
    )

    const totalBanks = accounts.length
    const totalCurrentBalance = accounts.reduce((total, account) => {
      return total + account.currentBalance
    }, 0)

    return parseStringify({ data: accounts, totalBanks, totalCurrentBalance })
  } catch (error) {
    console.error('An error occurred while getting the accounts:', error)
  }
}

// Get one bank account
export const getAccount = async ({ appwriteItemId }: getAccountProps) => {
  try {
    // get bank from db
    const bank = await getBank({ documentId: appwriteItemId })

    // get account info from plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: bank.accessToken,
    })
    const accountData = accountsResponse.data.accounts[0]

    // get transfer transactions from appwrite
    const transferTransactionsData = await getTransactionsByBankId({
      bankId: bank.$id,
    })

    const transferTransactions = transferTransactionsData.documents.map(
      (transferData: Transaction) => ({
        id: transferData.$id,
        name: transferData.name!,
        amount: transferData.amount!,
        date: transferData.$createdAt,
        paymentChannel: transferData.channel,
        category: transferData.category,
        type: transferData.senderBankId === bank.$id ? 'debit' : 'credit',
      })
    )

    // get institution info from plaid
    const institution = await getInstitution({
      institutionId: accountsResponse.data.item.institution_id!,
    })

    const transactions = await getTransactions({
      accessToken: bank?.accessToken,
    })

    const account = {
      id: accountData.account_id,
      availableBalance: accountData.balances.available!,
      currentBalance: accountData.balances.current!,
      institutionId: institution.institution_id,
      name: accountData.name,
      officialName: accountData.official_name,
      mask: accountData.mask!,
      type: accountData.type as string,
      subtype: accountData.subtype! as string,
      appwriteItemId: bank.$id,
    }

    // sort transactions by date such that the most recent transaction is first
    const allTransactions = [...transactions, ...transferTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    return parseStringify({
      data: account,
      transactions: allTransactions,
    })
  } catch (error) {
    console.error('An error occurred while getting the account:', error)
  }
}

// Get bank info
export const getInstitution = async ({ institutionId }: getInstitutionProps) => {
  try {
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: ['US'] as CountryCode[],
    })

    const intitution = institutionResponse.data.institution

    return parseStringify(intitution)
  } catch (error) {
    console.error('An error occurred while getting the accounts:', error)
  }
}

// Get transactions
export const getTransactions = async ({ accessToken }: getTransactionsProps) => {
  let hasMore = true
  let transactions: any = []

  try {
    // Iterate through each page of new transaction updates for item
    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
      })

      const data = response.data

      transactions = response.data.added.map((transaction) => ({
        id: transaction.transaction_id,
        name: transaction.name,
        paymentChannel: transaction.payment_channel,
        type: transaction.payment_channel,
        accountId: transaction.account_id,
        amount: transaction.amount,
        pending: transaction.pending,
        category: transaction.category ? transaction.category[0] : '',
        date: transaction.date,
        image: transaction.logo_url,
      }))

      hasMore = data.has_more
    }

    return parseStringify(transactions)
  } catch (error) {
    console.error('An error occurred while getting the accounts:', error)
  }
}
