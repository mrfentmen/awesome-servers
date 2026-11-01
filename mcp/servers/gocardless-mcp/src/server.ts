import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  GcError,
  cancelSubscription,
  createCustomer,
  createPayment,
  createRefund,
  createSubscription,
  formatBalance,
  formatCustomer,
  formatEvent,
  formatMandate,
  formatPayment,
  formatPayout,
  formatRefund,
  formatSubscription,
  getBalance,
  getCustomer,
  getMandate,
  getPayment,
  listCustomers,
  listEvents,
  listMandates,
  listPayments,
  listPayouts,
  listRefunds,
  listSubscriptions,
  mandateAction,
  paymentAction,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

const moneyNote = "Integer amount in the minor unit (pence or cents), not a decimal."

export function createServer(): McpServer {
  const server = new McpServer({
    name: "gocardless-mcp",
    version: "1.0.0",
  })

  server.tool(
    "list_customers",
    "List GoCardless customers, newest first.",
    {
      limit: z.number().int().min(1).max(500).default(20).describe("How many customers to return"),
    },
    async ({ limit }) => {
      try {
        const rows = await listCustomers(limit)
        if (rows.length === 0) return text("No customers yet.")
        return text(`Customers (${rows.length}):\n\n${rows.map((c, i) => formatCustomer(c, i)).join("\n\n")}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_customer",
    "Get one GoCardless customer by id.",
    { customer_id: z.string().describe("Customer id, starts with CU") },
    async ({ customer_id }) => {
      try {
        return text(formatCustomer(await getCustomer(customer_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_customer",
    "Create a GoCardless customer. Email is the only required field.",
    {
      email: z.string().describe("Customer email address"),
      given_name: z.string().optional().describe("First name"),
      family_name: z.string().optional().describe("Last name"),
      address_line1: z.string().optional().describe("Street address"),
      city: z.string().optional().describe("City"),
      postal_code: z.string().optional().describe("Postal or ZIP code"),
      country_code: z.string().optional().describe("ISO 3166-1 alpha-2 country code, e.g. GB"),
    },
    async (args) => {
      try {
        return text(formatCustomer(await createCustomer(args)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_payments",
    "List GoCardless payments, optionally filtered by status.",
    {
      limit: z.number().int().min(1).max(500).default(20).describe("How many payments to return"),
      status: z
        .string()
        .optional()
        .describe("Filter by status: pending, paid_out, cancelled, failed, charged_back, confirmed"),
    },
    async ({ limit, status }) => {
      try {
        const rows = await listPayments(limit, status)
        if (rows.length === 0) return text("No payments match that filter.")
        return text(`Payments (${rows.length}):\n\n${rows.map((p, i) => formatPayment(p, i)).join("\n\n")}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_payment",
    "Get one GoCardless payment by id.",
    { payment_id: z.string().describe("Payment id, starts with PM") },
    async ({ payment_id }) => {
      try {
        return text(formatPayment(await getPayment(payment_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_payment",
    "Create a payment against an active mandate. " + moneyNote,
    {
      amount: z.number().int().min(1).describe(moneyNote),
      currency: z.string().describe("ISO 4217 currency code, e.g. GBP or EUR"),
      mandate_id: z.string().describe("Mandate id the payment collects against, starts with MD"),
      description: z.string().optional().describe("What the payment is for, shown to the payer"),
      charge_date: z.string().optional().describe("Earliest charge date, YYYY-MM-DD"),
      reference: z.string().optional().describe("Your own reference for reconciliation"),
    },
    async (args) => {
      try {
        return text(formatPayment(await createPayment(args)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "cancel_payment",
    "Cancel a payment that has not yet been collected.",
    { payment_id: z.string().describe("Payment id to cancel") },
    async ({ payment_id }) => {
      try {
        return text(formatPayment(await paymentAction(payment_id, "cancel")))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "retry_payment",
    "Retry a failed payment.",
    { payment_id: z.string().describe("Payment id to retry") },
    async ({ payment_id }) => {
      try {
        return text(formatPayment(await paymentAction(payment_id, "retry")))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_refunds",
    "List recent GoCardless refunds.",
    { limit: z.number().int().min(1).max(500).default(20).describe("How many refunds to return") },
    async ({ limit }) => {
      try {
        const rows = await listRefunds(limit)
        if (rows.length === 0) return text("No refunds yet.")
        return text(`Refunds (${rows.length}):\n\n${rows.map((r, i) => formatRefund(r, i)).join("\n\n")}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_refund",
    "Refund a payment, in full or in part. " + moneyNote,
    {
      payment_id: z.string().describe("Payment id to refund"),
      amount: z.number().int().min(1).optional().describe(`Partial refund amount. ${moneyNote}`),
      currency: z.string().optional().describe("ISO 4217 currency code, only needed for partial refunds"),
    },
    async ({ payment_id, amount, currency }) => {
      try {
        return text(formatRefund(await createRefund(payment_id, amount, currency)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_mandates",
    "List GoCardless Direct Debit mandates.",
    { limit: z.number().int().min(1).max(500).default(20).describe("How many mandates to return") },
    async ({ limit }) => {
      try {
        const rows = await listMandates(limit)
        if (rows.length === 0) return text("No mandates yet.")
        return text(`Mandates (${rows.length}):\n\n${rows.map((m, i) => formatMandate(m, i)).join("\n\n")}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_mandate",
    "Get one mandate by id, including its status.",
    { mandate_id: z.string().describe("Mandate id, starts with MD") },
    async ({ mandate_id }) => {
      try {
        return text(formatMandate(await getMandate(mandate_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "cancel_mandate",
    "Cancel an active mandate so no further payments can be collected.",
    { mandate_id: z.string().describe("Mandate id to cancel") },
    async ({ mandate_id }) => {
      try {
        return text(formatMandate(await mandateAction(mandate_id, "cancel")))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "reinstate_mandate",
    "Reinstate a cancelled mandate.",
    { mandate_id: z.string().describe("Mandate id to reinstate") },
    async ({ mandate_id }) => {
      try {
        return text(formatMandate(await mandateAction(mandate_id, "reinstate")))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_subscriptions",
    "List recurring GoCardless subscriptions.",
    { limit: z.number().int().min(1).max(500).default(20).describe("How many subscriptions to return") },
    async ({ limit }) => {
      try {
        const rows = await listSubscriptions(limit)
        if (rows.length === 0) return text("No subscriptions yet.")
        return text(`Subscriptions (${rows.length}):\n\n${rows.map((s, i) => formatSubscription(s, i)).join("\n\n")}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_subscription",
    "Create a recurring subscription against an active mandate. " + moneyNote,
    {
      amount: z.number().int().min(1).describe(moneyNote),
      currency: z.string().describe("ISO 4217 currency code, e.g. GBP"),
      interval_unit: z.enum(["weekly", "monthly", "yearly"]).describe("How often to charge"),
      mandate_id: z.string().describe("Mandate id to charge, starts with MD"),
      name: z.string().optional().describe("Label shown on the payer's bank statement"),
      count: z.number().int().min(1).optional().describe("Total number of charges, omit for until-cancelled"),
    },
    async (args) => {
      try {
        return text(formatSubscription(await createSubscription(args)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "cancel_subscription",
    "Cancel a subscription so it stops collecting.",
    { subscription_id: z.string().describe("Subscription id, starts with SB") },
    async ({ subscription_id }) => {
      try {
        return text(formatSubscription(await cancelSubscription(subscription_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_payouts",
    "List payouts of collected funds to your bank account.",
    { limit: z.number().int().min(1).max(500).default(20).describe("How many payouts to return") },
    async ({ limit }) => {
      try {
        const rows = await listPayouts(limit)
        if (rows.length === 0) return text("No payouts yet.")
        return text(`Payouts (${rows.length}):\n\n${rows.map((p, i) => formatPayout(p, i)).join("\n\n")}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_balance",
    "Get one balance, for example your pending or available GBP balance.",
    { balance_id: z.string().describe("Balance id, starts with BA") },
    async ({ balance_id }) => {
      try {
        return text(formatBalance(await getBalance(balance_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_events",
    "List recent GoCardless events, useful for auditing payment and mandate changes.",
    { limit: z.number().int().min(1).max(500).default(20).describe("How many events to return") },
    async ({ limit }) => {
      try {
        const rows = await listEvents(limit)
        if (rows.length === 0) return text("No events yet.")
        return text(`Events (${rows.length}):\n\n${rows.map((e, i) => formatEvent(e, i)).join("\n\n")}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof GcError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
