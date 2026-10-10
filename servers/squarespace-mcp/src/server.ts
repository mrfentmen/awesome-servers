import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatOrder, formatProduct, listOrders, listProducts, SquarespaceError, domainRegistration, pageValidation } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "squarespace-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_products",
    {
      title: "List products",
      description: "Squarespace store products with prices and links.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        const rows = await listProducts(limit)
        if (rows.length === 0) return text("No products.")
        return text(rows.map((p, i) => formatProduct(p, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_orders",
    {
      title: "List orders",
      description: "Recent Squarespace orders with totals and customer emails.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        const rows = await listOrders(limit)
        if (rows.length === 0) return text("No orders.")
        return text(rows.map((o, i) => formatOrder(o, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "domain_registration",
    {
      title: "Domain registration",
      description:
        "The registry's own RDAP record for a domain: registrar, registration and expiry dates with the age and runway in words, last-changed date, client and server locks, DNSSEC status, and every nameserver grouped by provider. Needs no Squarespace key.",
      inputSchema: z.object({
        domain: z.string().describe("Domain name, e.g. example.com. A full URL is accepted and trimmed to its host."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: domain_registration ----
    const paywallMessage = await premiumRequired("domain_registration")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await domainRegistration(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "page_validation",
    {
      title: "Page validation",
      description:
        "Runs the W3C Nu HTML validator over a published page and reports the errors and warnings grouped by rule, the first of each with a line number, and the validator version. No Squarespace key needed.",
      inputSchema: z.object({
        url: z.string().describe("Address of the published page to validate, e.g. https://example.com/pricing."),
        limit: z.number().describe("Max messages of each kind listed, 1-40. Defaults to 8.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pageValidation(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof SquarespaceError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
