import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  CheckoutError,
  capturePayment,
  createCardToken,
  createCustomer,
  createInstrument,
  createPayment,
  formatAction,
  formatCustomer,
  formatDispute,
  formatInstrument,
  formatPayment,
  formatRefund,
  getCustomer,
  getDispute,
  getInstrument,
  getPayment,
  getPaymentActions,
  getRefund,
  listDisputes,
  refundPayment,
  voidPayment,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

const paymentId = z.string().min(1).describe("Payment id, e.g. 'pay_m4h2v3kq2xltnkqj7h8y5bzj3y'")
const majorAmount = z
  .number()
  .int()
  .min(1)
  .describe("Amount in the currency's minor unit, e.g. 1050 for 10.50 USD")

export function createServer(): McpServer {
  const server = new McpServer({
    name: "checkout-com-mcp",
    version: "1.0.0",
  })

  server.tool(
    "create_payment",
    "Take a card payment using a Checkout.com card token. Amounts are integers in the minor unit.",
    {
      token: z.string().min(1).describe("Card token from create_card_token, e.g. 'tok_...'"),
      amount: majorAmount,
      currency: z.string().length(3).describe("ISO-4217 currency code, e.g. 'USD'"),
      reference: z.string().optional().describe("Your own reference for reconciliation"),
      capture: z.boolean().default(true).describe("Capture immediately (true) or authorise only (false)"),
      customer_email: z.string().email().optional().describe("Customer email to attach"),
      customer_name: z.string().optional().describe("Customer name to attach"),
    },
    async ({ token, amount, currency, reference, capture, customer_email, customer_name }) => {
      try {
        const p = await createPayment({
          token,
          amount,
          currency,
          reference,
          capture,
          customerEmail: customer_email,
          customerName: customer_name,
        })
        return text(formatPayment(p))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_payment",
    "Fetch one payment and its current status, amount and card details.",
    { payment_id: paymentId },
    async ({ payment_id }) => {
      try {
        return text(formatPayment(await getPayment(payment_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_payment_actions",
    "List every action taken on a payment: authorisations, captures, voids and refunds.",
    { payment_id: paymentId },
    async ({ payment_id }) => {
      try {
        const actions = await getPaymentActions(payment_id)
        if (!actions.length) return text(`No actions recorded for ${payment_id}.`)
        return text(
          `Actions for ${payment_id} (${actions.length}):\n\n` +
            actions.map((a, i) => `${i + 1}. ${formatAction(a)}`).join("\n\n")
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "capture_payment",
    "Capture funds on an authorised payment. Omit amount to capture everything outstanding.",
    {
      payment_id: paymentId,
      amount: majorAmount.optional(),
      reference: z.string().optional().describe("Your own reference for the capture"),
    },
    async ({ payment_id, amount, reference }) => {
      try {
        return text(formatAction(await capturePayment(payment_id, amount, reference)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "void_payment",
    "Void an authorised but not yet captured payment.",
    {
      payment_id: paymentId,
      reference: z.string().optional().describe("Your own reference for the void"),
    },
    async ({ payment_id, reference }) => {
      try {
        return text(formatAction(await voidPayment(payment_id, reference)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "refund_payment",
    "Refund all or part of a captured payment. Omit amount to refund in full.",
    {
      payment_id: paymentId,
      amount: majorAmount.optional(),
      reference: z.string().optional().describe("Your own reference for the refund"),
    },
    async ({ payment_id, amount, reference }) => {
      try {
        return text(formatRefund(await refundPayment(payment_id, amount, reference)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_refund",
    "Fetch one refund by its refund id.",
    { refund_id: z.string().min(1).describe("Refund id, e.g. 'rf_...'") },
    async ({ refund_id }) => {
      try {
        return text(formatRefund(await getRefund(refund_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_customer",
    "Create a customer record to attach to future payments.",
    {
      email: z.string().email().describe("Customer email address"),
      name: z.string().optional().describe("Customer full name"),
    },
    async ({ email, name }) => {
      try {
        return text(formatCustomer(await createCustomer(email, name)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_customer",
    "Fetch one customer by id.",
    { customer_id: z.string().min(1).describe("Customer id, e.g. 'cus_...'") },
    async ({ customer_id }) => {
      try {
        return text(formatCustomer(await getCustomer(customer_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_card_token",
    "Tokenise raw card details. Use the returned token with create_payment so card data never touches your server.",
    {
      number: z.string().min(12).describe("Card number, digits only"),
      expiry_month: z.number().int().min(1).max(12).describe("Expiry month, 1-12"),
      expiry_year: z.number().int().min(2024).describe("Four digit expiry year"),
      cvv: z.string().min(3).max(4).describe("Card security code"),
      name: z.string().optional().describe("Cardholder name"),
    },
    async ({ number, expiry_month, expiry_year, cvv, name }) => {
      try {
        const t = await createCardToken({
          number,
          expiryMonth: expiry_month,
          expiryYear: expiry_year,
          cvv,
          name,
        })
        return text([`Token: ${t.token}`, t.type ? `Type: ${t.type}` : "", t.expires_on ? `Expires: ${t.expires_on}` : ""]
          .filter(Boolean)
          .join("\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_instrument",
    "Store a card token as a reusable instrument for later payments.",
    { token: z.string().min(1).describe("Card token from create_card_token") },
    async ({ token }) => {
      try {
        return text(formatInstrument(await createInstrument(token)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_instrument",
    "Fetch one stored instrument by id.",
    { instrument_id: z.string().min(1).describe("Instrument id, e.g. 'src_...'") },
    async ({ instrument_id }) => {
      try {
        return text(formatInstrument(await getInstrument(instrument_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_disputes",
    "List chargeback disputes raised against your payments.",
    { limit: z.number().int().min(1).max(100).default(10).describe("How many disputes to return") },
    async ({ limit }) => {
      try {
        const res = await listDisputes(limit)
        const disputes = res.data ?? []
        if (!disputes.length) return text("No disputes found.")
        return text(
          `Disputes (${disputes.length}):\n\n` + disputes.map((d, i) => `${i + 1}. ${formatDispute(d)}`).join("\n\n")
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_dispute",
    "Fetch one dispute by id, including category, status and amount.",
    { dispute_id: z.string().min(1).describe("Dispute id, e.g. 'dsp_...'") },
    async ({ dispute_id }) => {
      try {
        return text(formatDispute(await getDispute(dispute_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof CheckoutError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
