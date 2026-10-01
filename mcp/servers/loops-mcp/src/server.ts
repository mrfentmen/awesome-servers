import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { createContact, findContact, formatContact, LoopsError, sendEvent, sendingDomainDns, campaignLinkAudit } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const WRITE = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "loops-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "find_contact",
    {
      title: "Find contact",
      description: "Find a Loops contact by email.",
      inputSchema: z.object({
        email: z.string().describe("Email address"),
      }),
      annotations: READ_ONLY,
    },
    async ({ email }) => {
      try {
        const c = await findContact(email)
        if (!c) return text(`No Loops contact ${email}.`)
        return text(formatContact(c))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "create_contact",
    {
      title: "Create contact",
      description: "Create a Loops contact with optional first/last name.",
      inputSchema: z.object({
        email: z.string().describe("Email address"),
        first_name: z.string().default(""),
        last_name: z.string().default(""),
      }),
      annotations: WRITE,
    },
    async ({ email, first_name, last_name }) => {
      try {
        return text(await createContact(email, first_name, last_name))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "send_event",
    {
      title: "Send event",
      description: "Send a Loops event to trigger email flows.",
      inputSchema: z.object({
        email: z.string().describe("Contact email"),
        event_name: z.string().describe("Event name, e.g. 'signup'"),
        properties: z.record(z.string(), z.unknown()).default({}).describe("Event properties object"),
      }),
      annotations: WRITE,
    },
    async ({ email, event_name, properties }) => {
      try {
        return text(await sendEvent(email, event_name, properties as Record<string, unknown>))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "sending_domain_dns",
    {
      title: "Sending domain DNS",
      description: "What a sending domain publishes about its own mail: MX targets, the SPF record and its DNS-lookup count, and the DMARC policy with subdomain policy and pct. No Loops key needed.",
      inputSchema: z.object({ domain: z.string().describe("Sending domain, e.g. acme.com") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: sending_domain_dns ----
      const paywallMessage = await premiumRequired("sending_domain_dns")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(await sendingDomainDns(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "campaign_link_audit",
    {
      title: "Campaign link audit",
      description: "Check the links pasted out of a campaign are actually reachable: HTTP status, whether the final page is https, and where a redirect chain lands.",
      inputSchema: z.object({ links: z.string().describe("Links from the campaign, separated by spaces or commas."), limit: z.number().int().min(1).max(25).default(10).describe("How many links to check (default 10, max 25).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: campaign_link_audit ----
      const paywallMessage = await premiumRequired("campaign_link_audit")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(await campaignLinkAudit(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof LoopsError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
