import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  TlError,
  createPayment,
  createRefund,
  formatAccounts,
  formatBalance,
  formatCard,
  formatCards,
  formatDirectDebits,
  formatMe,
  formatMerchantAccounts,
  formatPayment,
  formatStandingOrders,
  formatTransactions,
  getAccount,
  getAccountBalance,
  getCardBalance,
  getMe,
  getPayment,
  listAccounts,
  listCardTransactions,
  listCards,
  listDirectDebits,
  listMerchantAccountTransactions,
  listMerchantAccounts,
  listPendingTransactions,
  listStandingOrders,
  listTransactions,
  money,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof TlError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "truelayer-mcp",
    version: "1.0.0",
  })

  server.tool(
    "get_me",
    "Show the TrueLayer application behind the current access token (client id, name, scopes).",
    {},
    async () => {
      try {
        return text(formatMe(await getMe()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_accounts",
    "List every bank account the user has consented to share.",
    {},
    async () => {
      try {
        return text(formatAccounts(await listAccounts()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_account",
    "Get one bank account's details (name, type, currency, provider, account number).",
    { account_id: z.string().describe("TrueLayer account id") },
    async ({ account_id }) => {
      try {
        return text(formatAccounts([await getAccount(account_id)]))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_account_balance",
    "Get the available and current balance for one account.",
    { account_id: z.string().describe("TrueLayer account id") },
    async ({ account_id }) => {
      try {
        return text(formatBalance(await getAccountBalance(account_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_transactions",
    "List booked transactions for an account, optionally between two ISO-8601 dates.",
    {
      account_id: z.string().describe("TrueLayer account id"),
      from: z.string().optional().describe("Start date, ISO-8601, e.g. 2026-10-01"),
      to: z.string().optional().describe("End date, ISO-8601, e.g. 2026-10-31"),
    },
    async ({ account_id, from, to }) => {
      try {
        return text(formatTransactions(await listTransactions(account_id, from, to)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_pending_transactions",
    "List pending (not yet booked) transactions for an account.",
    { account_id: z.string().describe("TrueLayer account id") },
    async ({ account_id }) => {
      try {
        return text(formatTransactions(await listPendingTransactions(account_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_cards",
    "List payment cards the user has consented to share.",
    {},
    async () => {
      try {
        return text(formatCards(await listCards()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_card_balance",
    "Get the current balance for one card.",
    { card_id: z.string().describe("TrueLayer card id (account_id on the card object)") },
    async ({ card_id }) => {
      try {
        return text(formatBalance(await getCardBalance(card_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_card_transactions",
    "List transactions made on one card.",
    { card_id: z.string().describe("TrueLayer card id (account_id on the card object)") },
    async ({ card_id }) => {
      try {
        return text(formatTransactions(await listCardTransactions(card_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_direct_debits",
    "List direct debits set up on the user's accounts.",
    {},
    async () => {
      try {
        return text(formatDirectDebits(await listDirectDebits()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_standing_orders",
    "List standing orders on the user's accounts.",
    {},
    async () => {
      try {
        return text(formatStandingOrders(await listStandingOrders()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_payment",
    "Create a Pay by Bank payment. Amounts are in MINOR units (pence/cents): 1299 means 12.99.",
    {
      amount_in_minor: z.number().int().min(1).describe("Amount in minor units, e.g. 1299 for 12.99"),
      currency: z.string().min(3).max(3).describe("ISO-4217 currency code, e.g. GBP"),
      reference: z.string().optional().describe("Reference shown on the payment"),
      user_id: z.string().optional().describe("TrueLayer user id to attach to the payment"),
      merchant_account_id: z
        .string()
        .optional()
        .describe("Beneficiary merchant account id (required to pay a merchant account)"),
      account_holder_name: z.string().optional().describe("Beneficiary account holder name"),
    },
    async ({ amount_in_minor, currency, reference, user_id, merchant_account_id, account_holder_name }) => {
      try {
        const payment = await createPayment({
          amountInMinor: amount_in_minor,
          currency,
          reference,
          userId: user_id,
          merchantAccountId: merchant_account_id,
          accountHolderName: account_holder_name,
        })
        return text(formatPayment(payment))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_payment",
    "Get the status and details of one payment.",
    { payment_id: z.string().describe("TrueLayer payment id") },
    async ({ payment_id }) => {
      try {
        return text(formatPayment(await getPayment(payment_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_refund",
    "Refund all or part of a settled payment. Amounts are in MINOR units.",
    {
      payment_id: z.string().describe("TrueLayer payment id to refund"),
      amount_in_minor: z.number().int().min(1).describe("Amount in minor units, e.g. 500 for 5.00"),
      reference: z.string().optional().describe("Reference shown on the refund"),
    },
    async ({ payment_id, amount_in_minor, reference }) => {
      try {
        return text(formatPayment(await createRefund(payment_id, amount_in_minor, reference)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_merchant_accounts",
    "List the merchant accounts belonging to this TrueLayer organisation.",
    {},
    async () => {
      try {
        return text(formatMerchantAccounts(await listMerchantAccounts()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_merchant_account_transactions",
    "List payments in and out of one merchant account.",
    { merchant_account_id: z.string().describe("TrueLayer merchant account id") },
    async ({ merchant_account_id }) => {
      try {
        const items = await listMerchantAccountTransactions(merchant_account_id)
        if (items.length === 0) return text("No merchant account transactions returned.")
        return text(formatTransactions(items))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_card",
    "Get the details of a single card.",
    { card_id: z.string().describe("TrueLayer card id") },
    async ({ card_id }) => {
      try {
        const cards = await listCards()
        const match = cards.find((c) => c.account_id === card_id)
        if (!match) return text(`No card found with id ${card_id}.`)
        return text(formatCard(match))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "sum_account_balances",
    "Total the available balance across every shared account, per currency.",
    {},
    async () => {
      try {
        const accounts = await listAccounts()
        if (accounts.length === 0) return text("No accounts returned for this access token.")
        const totals = new Map<string, number>()
        for (const account of accounts) {
          const balance = await getAccountBalance(account.account_id)
          const currency = balance.currency ?? account.currency ?? "?"
          const available = balance.available ?? 0
          totals.set(currency, (totals.get(currency) ?? 0) + available)
        }
        const lines = [...totals.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([currency, total]) => `${money(total, currency)} across ${accounts.length} account(s)`)
        return text(lines.join("\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
