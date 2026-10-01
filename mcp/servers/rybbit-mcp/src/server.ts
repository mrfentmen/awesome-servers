import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, getOverview, listUsers, getJourneys, domainProfile, trackingAudit } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "rybbit-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_overview",
    {
      title: "Get site overview",
      description: "Rybbit sessions, pageviews, users, bounce rate for a site and period.",
      inputSchema: z.object({
        site: z.string().describe("Site ID from Rybbit, e.g. 1"),
        startDate: z.string().describe("Start YYYY-MM-DD"),
        endDate: z.string().describe("End YYYY-MM-DD"),
        timeZone: z.string().default("UTC").describe("IANA timezone"),
      }),
      annotations: READ_ONLY,
    },
    async ({ site, startDate, endDate, timeZone }) => {
      try {
        return text(await getOverview(site, startDate, endDate, timeZone));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_users",
    {
      title: "List users",
      description: "Rybbit users for a site with pagination.",
      inputSchema: z.object({
        site: z.string().describe("Site ID from Rybbit, e.g. 1"),
        startDate: z.string().describe("Start date, e.g. 2026-09-01"),
        endDate: z.string().describe("End date, e.g. 2026-09-30"),
        timeZone: z.string().default("UTC").describe("IANA timezone, e.g. Europe/Berlin"),
        limit: z.number().default(20).describe("Max rows to return, e.g. 20"),
      }),
      annotations: READ_ONLY,
    },
    async ({ site, startDate, endDate, timeZone, limit }) => {
      try {
        return text(await listUsers(site, startDate, endDate, timeZone, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_journeys",
    {
      title: "Get journeys",
      description: "Common Rybbit navigation paths (journeys) through a site.",
      inputSchema: z.object({
        site: z.string().describe("Site ID from Rybbit, e.g. 1"),
        startDate: z.string().describe("Start date, e.g. 2026-09-01"),
        endDate: z.string().describe("End date, e.g. 2026-09-30"),
        timeZone: z.string().default("UTC").describe("IANA timezone, e.g. Europe/Berlin"),
      }),
      annotations: READ_ONLY,
    },
    async ({ site, startDate, endDate, timeZone }) => {
      try {
        return text(await getJourneys(site, startDate, endDate, timeZone));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "domain_profile",
    {
      title: "Domain registry profile",
      description:
        "The registry record behind a domain the analytics is attributed to: registrar, registrant, registration and expiry dates, DNSSEC, transfer locks and name servers, with anything that qualifies the traffic history.",
      inputSchema: z.object({
        domain: z.string().describe("Domain name, e.g. 'example.com'"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: domain_profile ----
    const paywallMessage = await premiumRequired("domain_profile")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await domainProfile(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "tracking_audit",
    {
      title: "Tracking tag audit",
      description:
        "Which measurement tags a page actually loads, read from the live HTML: the analytics vendors referenced, the specific GA4, GTM, Meta, Hotjar and Plausible identifiers, the framework, and whether the page is counted more than once.",
      inputSchema: z.object({
        url: z.string().describe("Page to audit, e.g. 'https://example.com'"),
        limit: z.number().describe("Max entries per list, 1-25. Defaults to 10.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: tracking_audit ----
    const paywallMessage = await premiumRequired("tracking_audit")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await trackingAudit(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}
